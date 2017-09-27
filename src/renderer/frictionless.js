import {Table} from 'tableschema'
import {Resource, Package} from 'datapackage'
import {HotRegister} from '../renderer/hot.js'
import store from '../renderer/store/modules/hots.js'

async function initPackage(data) {
  const dataPackage = await Package.load()
  await dataPackage.infer(data)
  return dataPackage
}

async function initDataAndInferSchema(data) {
  const table = await Table.load(data)
  await table.infer()
  return table
}

async function initData(data) {
  const table = await Table.load(data)
  return table
}

async function initStrictData(data) {
  const table = await Table.load(data, {strict: true})
  return table
}

async function initDataAgainstSchema(data, schema) {
  // provide schema rather than infer
  let table = await Table.load(data, {schema: schema})
  return table
}

async function storeData(hotId, table) {
  await store.mutations.pushTableSchema(store.state, {
    hotId: hotId,
    tableSchema: table
  })
}

export async function guessColumnProperties() {
  let activeHot = HotRegister.getActiveHotIdData()
  let table = await initDataAndInferSchema(activeHot.data)
  storeData(activeHot.id, table)
  let tableDescriptor = table.schema.descriptor
  return {
    'hotId': activeHot.id,
    'columnProperties': tableDescriptor.fields
  }
}

// function checkRowCells(row, schema) {
//   try {
//     console.log('checking each cell of row:')
//     console.log(row)
//     let indexCount = -1
//
//     for (const [index, cell] of row.entries()) {
//       console.log(`index is ${index}`)
//       console.log(`cell value is ${cell}`)
//       const field = schema.fields[index]
//       console.log('logging field...')
//       console.log(field)
//       field.castValue(cell, false)
//     }
//   } catch (err) {
//     console.log('got cell error')
//     console.log(err)
//     // if (err.multiple) {
//     //   for (const error of err.errors) {
//     //     console.log(error)
//     //   }
//     // } else {
//     //   console.log(err)
//     // }
//   }
// }

function checkRow(rowNumber, row, schema, errorCollector) {
  try {
    schema.castRow(row)
  } catch (err) {
    if (err.multiple) {
      for (const error of err.errors) {
        // console.log(error)
        errorCollector.push({rowNumber: rowNumber, message: error.message, name: error.name})
      }
    } else {
      console.log(err)
    }
  }
}

export async function validateActiveDataWithNoSchema() {
  let activeHotObject = HotRegister.getActiveHotIdData()
  try {
    let table = await initStrictData(activeHotObject.data)
    let result = await table.read({keyed: true})
  } catch (err) {
    if (err.multiple) {
      for (const error of err.errors) {
        console.log(error)
      }
    } else {
      console.log(err)
    }
  }
}

async function checkForSchema(activeHotObject) {
  let tableSchema = _.get(store.state.hotTabs, `${activeHotObject.id}.tableSchema`)
  if (!tableSchema) {
    tableSchema = await initDataAndInferSchema(activeHotObject.data)
  }
  let table = await initDataAgainstSchema(activeHotObject.data, tableSchema.schema)
  table.schema.commit()
  return table
}

export async function validateActiveDataAgainstSchema(callback) {
  let activeHotObject = HotRegister.getActiveHotIdData()
  // if no current schema - infer, but don't store it - this should be done if 'guess column properties'
  let table = await checkForSchema(activeHotObject)
  // don't cast at stream, wait until row to cast otherwise not all errors will be reported.
  const errorCollector = []
  const stream = await table.iter({
    extended: true,
    stream: true,
    cast: false
  })
  stream.on('data', (row) => {
    // console.log(`row number: ${row[0]}`)
    checkRow(row[0], row[2], table.schema, errorCollector)
  })
  callback(errorCollector)
}
