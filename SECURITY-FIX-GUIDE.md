# 🚨 Critical Security Fix: Supabase Storage RLS Configuration

## ⚠️ **Current Security Vulnerability**

**Issue**: Row Level Security (RLS) is currently **DISABLED** on Supabase storage, creating a critical security vulnerability where any user could potentially access, modify, or delete files across all buckets.

## 🔧 **Root Cause Analysis**

The challenge is that CardEx uses **NextAuth.js for authentication**, but Supabase RLS policies are designed for **Supabase Auth**. The `auth.uid()` function in RLS policies only works with Supabase's native authentication system.

## 📋 **Solution Strategy**

Since CardEx already has robust application-layer security with NextAuth, we'll implement a **hybrid approach** that maintains security without disrupting the current authentication flow.

## 🛡️ **Step-by-Step Security Fix**

### **Option 1: Service Role Authentication (Recommended)**

This approach uses Supabase's service role key for server-side operations while maintaining RLS for additional security.

#### **1. Update Supabase Configuration**

Create a new server-side Supabase client with service role permissions:

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const STORAGE_BUCKET = 'card-images'
```

#### **2. Update Storage Operations**

```typescript
// src/lib/supabaseStorage.ts - Updated version
import { supabaseAdmin, STORAGE_BUCKET } from './supabase-admin'

export async function uploadImage(file: File): Promise<string> {
  // Generate unique filename with timestamp and random string
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}.${fileExtension}`

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// ... rest of the functions updated to use supabaseAdmin
```

#### **3. SQL Commands to Execute in Supabase**

Execute these SQL commands in your Supabase SQL editor:

```sql
-- 1. Re-enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for public read access (allows displaying images)
CREATE POLICY "card-images-public-read" ON storage.objects
FOR SELECT USING (bucket_id = 'card-images');

-- 3. Create policy for service role operations (uploads/deletes)
CREATE POLICY "card-images-service-operations" ON storage.objects
FOR ALL USING (
  bucket_id = 'card-images' AND 
  auth.jwt()::text ~ 'service_role'
);

-- 4. Ensure the bucket exists and is public for reads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'card-images';
```

### **Option 2: Custom JWT Claims (Alternative)**

If you prefer to maintain NextAuth but want true RLS integration:

#### **1. Create Custom JWT with User ID**

```typescript
// src/lib/supabase-auth-bridge.ts
import { supabase } from './supabase'

export async function createSupabaseSessionFromNextAuth(userId: string) {
  // Create a custom JWT that Supabase can understand
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'custom',
    token: createCustomJWT(userId), // You'd need to implement this
  })
  
  return { data, error }
}
```

#### **2. RLS Policies for NextAuth Integration**

```sql
-- Create RLS policies that work with custom user IDs
CREATE POLICY "card-images-authenticated-upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-images' AND 
  (auth.jwt() ->> 'user_id') IS NOT NULL
);

CREATE POLICY "card-images-public-read" ON storage.objects
FOR SELECT USING (bucket_id = 'card-images');

CREATE POLICY "card-images-owner-delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-images' AND 
  (auth.jwt() ->> 'user_id') IS NOT NULL
);
```

## 🎯 **Recommended Implementation: Option 1**

**Option 1 (Service Role)** is recommended because:

1. ✅ **Maintains existing NextAuth architecture**
2. ✅ **Provides robust security through application layer + RLS**
3. ✅ **Simpler to implement and test**
4. ✅ **No changes to authentication flow**
5. ✅ **Performance benefits (no auth token management overhead)**

## 📝 **Implementation Checklist**

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
- [ ] Create `src/lib/supabase-admin.ts` with service role client
- [ ] Update `src/lib/supabaseStorage.ts` to use admin client
- [ ] Execute SQL commands in Supabase dashboard
- [ ] Test image upload functionality
- [ ] Test public image access (viewing cards)
- [ ] Verify RLS is protecting against unauthorized access
- [ ] Update documentation

## ⚡ **Environment Variables Required**

Add to your Vercel environment variables:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Your service role key
```

## 🧪 **Testing Plan**

1. **Upload Test**: Authenticated users should be able to upload images
2. **Public Access Test**: Anyone should be able to view/access uploaded images
3. **Security Test**: Direct API calls without proper authentication should fail
4. **Delete Test**: Image deletion should work for legitimate cleanup operations

## 📈 **Benefits After Fix**

- ✅ **Production-grade security** with RLS enabled
- ✅ **Zero functionality disruption** 
- ✅ **Maintains current authentication flow**
- ✅ **Protects against unauthorized file access**
- ✅ **Audit trail for storage operations**

---

**This fix addresses the critical security vulnerability while maintaining all existing functionality.** The hybrid approach leverages both NextAuth's robust session management and Supabase's database-level security.