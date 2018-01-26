import { types, applySnapshot } from 'mobx-state-tree'
import { autorun } from 'mobx'
import deepstream from 'deepstream.io-client-js'

//TODO: externalize deepstream client config/login
export const client = deepstream('localhost:6020').login()

const DeepstreamRecord = types.model('DeepstreamRecord')
  .views(self => {
    return {
      //override this to return a unique key to fetch your record from deepstream
      get storageKey() {
        throw new Error('DeepstreamRecord::storageKey getter must be implemented')
      }
    }
  })
  .actions(self => {
    let dsRecord

    return {
      afterCreate() {
        dsRecord = client.record.getRecord(self.storageKey)
        dsRecord.subscribe(data => applySnapshot(self, data))
      },

      beforeDestroy() {
        dsRecord.unsubscribe()
        dsRecord.discard()
      }
    }
  })

/**
 * n.b.: This only supports homogenous lists, and is intended as a simple id-based index
 *    for records of the same type
 * Using a factory here to get the dependent record model injected
 * @param {types.model<DeepstreamRecord>} model the record model which will be used for items in the list
 * @param {string} idPath path to the id property of the model
 * @param {string} idPrefix prefix to prepend to id, if id isn't self describing already
 * @param {string} listKey the key to use for the list in deepstream
 */
const DeepstreamListFactory = ({ model, idPath, idPrefix = '', listKey }) => {
  if (!idPath) {
    throw new Error('idPath property must be specified for instances of DeepStreamList.')
  }
  if (!listKey) {
    throw new Error('listKey property must be specified for instances of DeepStreamList.')
  }

  const prefixRegex = new RegExp(`^${idPrefix}`)

  return types.model('DeepStreamList', {
    records: types.optional(types.map(model), {}),
    entries: types.optional(types.array(types.string), [])
  }).actions(self => {
    let dsList, disposer

    return {
      afterCreate() {
        dsList = client.record.getList(listKey)
        dsList.whenReady(() => dsList.subscribe(self.setEntries, true))

        //reactive listener that will automatically load records when the
        //entries collection changes
        disposer = autorun(() => {
          if (self.entries.length > 0) {
            self.loadRecords(self.entries)
          }
        })
      },

      setEntries(entries) {
        entries.forEach(entry => {
          if (self.entries.indexOf(entry) === -1) {
            self.entries.push(entry)
          }
        })
      },

      loadRecords(entries) {
        entries.forEach(entry => {
          if (!self.records.has(entry)) {
            const id = entry.replace(prefixRegex, '')
            self.records.set(id, { [idPath]: id })
          }
        })
      },

      addRecord(data = {}) {
        const record = model.create(data)
        const prefixedId = `${idPrefix}${record[idPath]}`
        self.records.set(prefixedId, record)
        self.entries.push(prefixedId)
        dsList.addEntry(prefixedId)
      },

      beforeDestroy() {
        dsList.discard()
        disposer()
      }
    }
  })
}

export { DeepstreamRecord, DeepstreamListFactory }
