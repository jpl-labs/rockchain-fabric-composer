// @flow
import React, { Component } from 'react'
import { Formik, Form } from 'formik'
import yup from 'yup'
import { values, map } from 'ramda'
import { TextField, SelectField, MenuItem } from 'material-ui'
import { Charities } from '../../state'
import type { RegisterUserTx } from '../../state'

const charities = values(Charities)

const validationSchema = yup.object().shape({
  email: yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  charity: yup.mixed().oneOf(charities, 'Please choose a charity')
})

type RegistrationFormProps = {
  onSubmit(values: RegisterUserTx): void
}

class RegistrationForm extends Component<RegistrationFormProps> {
  form: ?{submitForm(): void}

  handleSubmit = (values: RegisterUserTx, { setSubmitting }: any) => {
    setSubmitting(false)
    this.props.onSubmit && this.props.onSubmit(values)
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
      <TextField
        name="email"
        floatingLabelText="Email"
        hintText="Enter a valid email address"
        value={values.email}
        onChange={handleChange}
        errorText={errors.email && touched.email ? errors.email : null}
      />
      <SelectField
        id="charity"
        floatingLabelText="Charity"
        hintText="Select a charity"
        value={values.charity}
        onChange={(evt, idx, newValue) => setFieldValue('charity', newValue)}
        errorText={errors.charity && touched.charity ? errors.charity : null}
      >
        {map(charity => (
          <MenuItem value={charity} key={charity} primaryText={charity} />
        ), charities)}
      </SelectField>
    </Form>
  )

  submitForm = () => this.form && this.form.submitForm()

  render() {
    return (
      <Formik
        ref={form => this.form = form}
        initialValues={{ email: '', charity: Charities.Undefined }}
        onSubmit={this.handleSubmit}
        validationSchema={validationSchema}
        render={this.renderForm}
      />
    )
  }
}

export default RegistrationForm
