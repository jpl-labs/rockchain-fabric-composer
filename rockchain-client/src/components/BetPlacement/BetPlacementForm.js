// @flow
import React, { Component } from 'react'
import { Formik, Form } from 'formik'
import yup from 'yup'
import { TextField } from 'material-ui'
import type { MakeBetTx } from '../../state'

const validationSchema = yup.object().shape({
  artist: yup.string().required('Artist is required'),
  numberOfRounds: yup.number()
    .min(1, 'Bet must be for at least 1 round')
    .max(50, 'Bet must not be for more than 50 rounds')
    .integer('Please enter a whole number (integer)')
})

type BetPlacementFormProps = {
  onSubmit(values: MakeBetTx): void
}

class BetPlacementForm extends Component<BetPlacementFormProps> {
  form: ?{submitForm(): void}

  handleSubmit = (values: MakeBetTx, { setSubmitting }: any) => {
    this.props.onSubmit && this.props.onSubmit(values)
    setSubmitting(false)
  }

  renderForm = ({
    values,
    touched,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue
  }: any) => (
    <Form>
      {/* TODO: autocomplete/filter on artists */}
      <TextField
        name="artist"
        floatingLabelText="Artist"
        hintText="Artist"
        value={values.artist}
        onChange={handleChange}
        errorText={errors.artist && touched.artist ? errors.artist : null}
      />
      <TextField
        name="numberOfRounds"
        type="number"
        floatingLabelText="Number of Rounds (max 50)"
        hintText="Number of rounds"
        value={values.numberOfRounds}
        onChange={handleChange}
        errorText={errors.numberOfRounds && touched.numberOfRounds ? errors.numberOfRounds : null}
      />
    </Form>
  )

  submitForm = () => this.form && this.form.submitForm()

  render() {
    return (
      <Formik
        ref={form => this.form = form}
        initialValues={{ artist: '', numberOfRounds: 1 }}
        onSubmit={this.handleSubmit}
        validationSchema={validationSchema}
        render={this.renderForm}
      />
    )
  }
}

export default BetPlacementForm
