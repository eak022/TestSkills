import { t } from 'elysia'

export const FileModel = t.Object({
  originalName: t.String({ example: 'file-name.png' }),
  filePath: t.String({ example: 'url/file-name.png' }),
  fileType: t.String({ example: 'image/png' })
})

export const FilesModel = t.Array(FileModel)

export type FileModel = typeof FileModel.static
export type FilesModel = typeof FilesModel.static
