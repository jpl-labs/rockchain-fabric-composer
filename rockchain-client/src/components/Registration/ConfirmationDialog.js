// @flow
import React, { Component } from 'react'
import { Dialog, FlatButton } from 'material-ui'

type ConfirmationDialogProps = {
  open: ?boolean,
  onConfirm(): void,
  onCancel(): void
}

class ConfirmationDialog extends Component<ConfirmationDialogProps> {
  render() {
    const { open = false, onConfirm, onCancel } = this.props

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={onCancel}
      />,
      <FlatButton
        primary={true}
        label="Confirm"
        onClick={onConfirm}
      />
    ]

    return (
      <Dialog
        title="Registration Confirmation"
        actions={actions}
        modal={true}
        open={open}
      >
        <p>
          Close this dialog to confirm registration!
        </p>
        <p>
          Please note that it may take up to a minute before your account funds are transferred.
        </p>
        <p>
          IMPORTANT: Please take note of your wallet hash (found at the top of the next page) and your password. Lost account information is irrecoverable.
        </p>
      </Dialog>
    )
  }
}

export default ConfirmationDialog
