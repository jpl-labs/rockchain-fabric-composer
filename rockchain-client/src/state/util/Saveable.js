import { autorun } from 'mobx'
import { types, flow, applySnapshot } from 'mobx-state-tree'

const Saveable = types.model('Saveable', {
  autoSave: false
}).actions(self => {
  let disposer

  return {
    afterCreate() {
      disposer = autorun(() => {
        //calling self.toJSON() inside an autorun = watch all changes
        if (self.autoSave && self.toJSON()) {
          self.save()
        }
      })
    },

    beforeDestroy() {
      disposer()
    },

    setAutoSave(autoSave) {
      self.autoSave = !!autoSave
    },

    applySnapshot(data) {
      const autoSave = self.autoSave
      self.setAutoSave(false)
      applySnapshot(self, data)
      self.setAutoSave(autoSave)
    },

    // yielding to beforeSave allows a model to implement validation strategies
    // (the beforeSave promise chain is called first in all cases, so any .then()s
    // in the save chain will be dependent on the beforeSave chain completing successfully)
    save: flow(function*() {
      return yield self.beforeSave(self.toJSON())
    }),

    beforeSave(data) {
      return Promise.resolve(data)
    }
  }
})

export default Saveable
