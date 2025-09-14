// Jest manual mock for file-type module

export const fileTypeFromBuffer = jest.fn().mockResolvedValue({
  ext: 'jpg',
  mime: 'image/jpeg'
})

const fileTypeMock = {
  fileTypeFromBuffer
}

export default fileTypeMock