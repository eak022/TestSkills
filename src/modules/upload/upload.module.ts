import Elysia from 'elysia'
import { UploadHttpController } from './commands/upload.http.controller'

const UploadV1Route = new Elysia({
  name: 'UploadV1Route',
  prefix: '/v1/upload',
  tags: ['v1', 'Upload'] })
  .use(UploadHttpController)

const UploadModule = new Elysia({ name: 'UploadModule' })
  .use(UploadV1Route)

export default UploadModule
