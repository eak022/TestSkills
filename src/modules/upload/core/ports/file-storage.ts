export interface FileStorage {
  uploadOne(file: File, subFolder?: string): Promise<UploadedFile>
  uploadMany(files: File[], subFolder?: string): Promise<UploadedFile[]>
  getPresignedUrl?(filePath: string, expiration: number): Promise<string>
  deleteFile?(filePath: string): Promise<void>
}

export interface UploadedFile {
  originalName: string
  fileUrl: string
  fileType: string
  filePath: string
}
