const state = {
  hotTabs: {}
}

function getHotColumnPropertiesFromPropertyObject(property) {
  // console.log(`getting...`)
  // console.log(property)
  let allHotColumnProperties = state.hotTabs[property.hotId].columnProperties
  if (!allHotColumnProperties) {
    // console.log('resetting all hot columns')
    allHotColumnProperties = state.hotTabs[property.hotId].columnProperties = []
    // console.log(state.hotTabs)
  }
  let hotColumnProperties = allHotColumnProperties[property.columnIndex]
  if (!hotColumnProperties) {
    // console.log('resetting hot column properties')
    hotColumnProperties = state.hotTabs[property.hotId].columnProperties[property.columnIndex] = {}
  }
  return hotColumnProperties
}

const getters = {
  getAllHotColumnPropertiesFromHotId: (state, getters) => (hotId) => {
    return state.hotTabs[hotId].columnProperties
  },
  getHotTableSchema: (state, getters) => (hotId) => {
    return state.hotTabs[hotId].tableSchema
  },
  getHotIdFromTabId: (state, getters) => (tabId) => {
    return new Promise((resolve, reject) => {
      let hotId = _.findKey(state.hotTabs, {tabId: tabId})
      if (!hotId) {
        // There is a short render wait in home page, so if hotId not first returned, just wait and try again
        _.delay(function(tabId) {
          resolve(_.findKey(state.hotTabs, {tabId: tabId}))
        }, 10, tabId)
      } else {
        resolve(hotId)
      }
    })
  },
  getMissingValuesFromHot: (state, getters) => (hotId) => {
    return state.hotTabs[hotId].missingValues
  },
  getHotColumnProperty: (state, getters) => (property) => {
    let hotColumnProperties = getHotColumnPropertiesFromPropertyObject(property)
    return hotColumnProperties[property.key]
  },
  getHotColumnConstraints: (state, getters) => (property) => {
    let hotColumnProperties = getHotColumnPropertiesFromPropertyObject(property)
    return hotColumnProperties['constraints']
  },
  getConstraint: (state, getters) => (property) => {
    let hotColumnProperties = getHotColumnPropertiesFromPropertyObject(property)
    let constraints = hotColumnProperties['constraints']
    if (!constraints) {
      constraints = state.hotTabs[property.hotId].columnProperties[property.columnIndex].constraints = {}
    }
    return constraints[property.key]
  }
}

const mutations = {
  pushHotTab(state, hotTab) {
    let hotId = hotTab.hotId
    if (!hotId) {
      return
    }
    if (hotTab.tabId) {
      _.set(state.hotTabs, `${hotId}.tabId`, hotTab.tabId)
    }
  },
  pushHotColumns(state, hotTab) {
    mutations.pushHotColumnsAndOverwrite(state, hotTab)
    // update table schema
    mutations.updateTableSchemaWithColumnProperties(state, hotTab.hotId)
  },
  pushHotColumnsAndOverwrite(state, hotTab) {
    let hotId = hotTab.hotId
    let incoming = {}
    _.set(incoming, `${hotId}.columnProperties`, hotTab.columnProperties)
    // update existing values and write in new ones where none currently exist
    _.merge(state.hotTabs, incoming)
  },
  pushHotColumnsAndUnderwrite(state, hotTab) {
    let hotId = hotTab.hotId
    let current = {}
    _.set(current, `${hotId}.columnProperties`, state.hotTabs[hotId].columnProperties)
    // intended for pushing schema descriptor: only write new values for those which don't already exist
    _.set(state.hotTabs, `${hotId}.columnProperties`, hotTab.columnProperties)
    _.merge(state.hotTabs, current)
  },
  pushHotProperty(state, property) {
    _.set(state.hotTabs, `${property.hotId}.columnProperties[${property.columnIndex}].${property.key}`, property.value)
  },
  pushConstraint(state, property) {
    _.set(state.hotTabs, `${property.hotId}.columnProperties[${property.columnIndex}].constraints[${property.key}]`, property.value)
  },
  pushMissingValues(state, hotMissingValues) {
    let hotId = hotMissingValues.hotId
    _.set(state.hotTabs, `${hotId}.missingValues`, hotMissingValues.missingValues)
    if (state.hotTabs[hotId].tableSchema) {
      mutations.mergeCurrentMissingValuesOverTableSchema(state, hotId)
    }
  },
  updateTableSchemaWithColumnProperties(state, hotId) {
    if (state.hotTabs[hotId].tableSchema) {
      mutations.mergeCurrentColumnPropertiesOverTableSchema(state, hotId)
    }
  },
  pushTableSchema(state, hotTable) {
    let hotId = hotTable.hotId
    _.set(state.hotTabs, `${hotId}.tableSchema`, hotTable.tableSchema)
    mutations.mergeTableSchemaOverCurrentColumnProperties(state, hotId)
  },
  // pushing a new schema should also merge over current column properties
  mergeTableSchemaOverCurrentColumnProperties(state, hotId) {
    let hotTab = state.hotTabs[hotId]
    let tableSchemaProperties = hotTab.tableSchema.schema.descriptor.fields
    if (!hotTab.columnProperties) {
      hotTab.columnProperties = []
    }
    _.merge(hotTab.columnProperties, tableSchemaProperties)
  },
  // a new schema infer shouldn't overwrite any user created input
  mergeCurrentColumnPropertiesOverTableSchema(state, hotId) {
    let hotTab = state.hotTabs[hotId]
    let tableSchemaProperties = hotTab.tableSchema.schema.descriptor.fields
    let columnProperties = hotTab.columnProperties || []
    _.merge(tableSchemaProperties, columnProperties)
  },
  mergeCurrentMissingValuesOverTableSchema(state, hotId) {
    let hotTab = state.hotTabs[hotId]
    let tableSchemaProperties = hotTab.tableSchema.schema.descriptor.missingValues
    let missingValues = hotTab.missingValues || []
    _.merge(tableSchemaProperties, missingValues)
  },
  destroyHotTab(state, hotId) {
    _.unset(state.hotTabs, hotId)
  },
  destroyHotTabFromTabId(state, tabId) {
    let hotId = getters.getHotIdFromTabId()
    _.unset(state.hotTabs, hotId)
  }
}

export default {
  state,
  getters,
  mutations
}
