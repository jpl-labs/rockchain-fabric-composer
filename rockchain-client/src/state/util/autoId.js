import { types } from 'mobx-state-tree'
import uuidv4 from 'uuid/v4'

const autoId = ({ prefix = '' } = {}) => {
  return types.optional(types.identifier(types.string), () => prefix + uuidv4())
}

export default autoId
