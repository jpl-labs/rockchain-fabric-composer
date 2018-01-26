// @flow
export const Charities = {
  Undefined: 'Undefined',
  Animals: 'Animals',
  Kids: 'Kids',
  Disaster: 'Disaster'
}

// union-type based enum (https://flow.org/en/docs/types/utilities/#toc-keys)
export type Charity = $Keys<typeof Charities>
