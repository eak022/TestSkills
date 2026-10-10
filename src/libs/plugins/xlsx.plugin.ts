import * as XLSX from 'xlsx'

export interface Raw { [key: string]: string }

export async function writeFileBuffer (excelSheet: any) {
  const worksheet = await XLSX.utils.json_to_sheet(excelSheet)
  const wb: XLSX.WorkBook = {
    Sheets: {
      Sheet1: worksheet
    },
    SheetNames: ['Sheet1']
  }
  const wopts: XLSX.WritingOptions = {
    bookType: 'xlsx',
    bookSST: false,
    type: 'buffer'
  }

  return XLSX.write(wb, wopts)
}

export async function writeFileBufferCsv (excelSheet: any) {
  const worksheet = await XLSX.utils.json_to_sheet(excelSheet)
  const wb: XLSX.WorkBook = {
    Sheets: {
      Sheet1: worksheet
    },
    SheetNames: ['Sheet1']
  }
  const wopts: XLSX.WritingOptions = {
    bookType: 'csv',
    bookSST: false,
    type: 'buffer'
  }

  return XLSX.write(wb, wopts)
}

export function readFileBuffer (filePath: string, sheetName?: string) {
  const workbook = XLSX.readFile(filePath)
  const workName = sheetName || workbook.SheetNames[0] as string
  const worksheet = workbook.Sheets[workName]
  if (!worksheet) {
    throw new Error(`Not found work sheet name: ${workName}`)
  }
  return XLSX.utils.sheet_to_json<Raw>(worksheet)
}
