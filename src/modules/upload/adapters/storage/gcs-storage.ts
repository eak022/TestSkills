export const toUploadUtilFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    originalname: file.name,
    buffer
  }
}
