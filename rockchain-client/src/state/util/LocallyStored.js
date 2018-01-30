import { types, flow, applySnapshot } from 'mobx-state-tree'
import Saveable from './Saveable'
import storeJS from 'store/dist/store.modern'

const LocallyStored = types.compose(
  Saveable,
  types.model().actions(self => {
    const _save = self.save

    return {
      afterCreate() {
        //attempt to retrieve props from local storage
        const localData = storeJS.get(self.storageKey)
        if (localData) {
          applySnapshot(self, localData)
        }
      },

      save: flow(function*() {
        const data = yield _save()
        storeJS.set(self.storageKey, data)
        return data
      })
    }
  }).views(self => {
    return {
      //override this to return a unique key to use to store your instance
      get storageKey() {
        throw new Error('LocallyStored::storageKey getter must be implemented')
      }
    }
  })
).named('LocallyStored')

export default LocallyStored
