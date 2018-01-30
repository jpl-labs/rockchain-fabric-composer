// @flow
import React, { Component } from 'react'
import { Formik, Form } from 'formik'
import yup from 'yup'
import { TextField } from 'material-ui'

const validationSchema = yup.object().shape({
  email: yup.string()
    .email('Invalid email address')
    .required('Email is required')
  //TODO: pw/auth0 integration
})

export type LoginTx = {
  email: string
}

type LoginFormProps = {
  onSubmit(values: LoginTx): void
}

class LoginForm extends Component<LoginFormProps> {
  form: ?{submitForm(): void}

  handleSubmit = (values: LoginTx, { setSubmitting }: any) => {
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
    </Form>
  )

  submitForm = () => this.form && this.form.submitForm()

  render() {
    return (
      <Formik
        ref={form => this.form = form}
        initialValues={{ email: ''}}
        onSubmit={this.handleSubmit}
        validationSchema={validationSchema}
        render={this.renderForm}
      />
    )
  }
}

export default LoginForm
