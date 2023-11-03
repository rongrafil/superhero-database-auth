import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { Link } from 'components';
import { Layout } from 'components/account';
import { userService, alertService } from 'services';

export default Confirm;

function Confirm() {
    const router = useRouter();

    // form validation rules 
    const validationSchema = Yup.object().shape({
        code: Yup.string()
            .required('Confirmation code is required'),
    });
    const formOptions = { resolver: yupResolver(validationSchema) };

    // get functions to build form with useForm() hook
    const { register, handleSubmit, formState } = useForm(formOptions);
    const { errors } = formState;

    function onSubmit(user) {
        return userService.confirm(router.query.username, user.code)
            .then(() => {
                alertService.success('Registration successful', { keepAfterRouteChange: true });
                router.push('login');
            })
            .catch(alertService.error);
    }

    function resend() {
        return userService.resend(router.query.username)
            .then(() => {
                alertService.success('Confirmation code has been resent to your email', { keepAfterRouteChange: true });
            })
            .catch(alertService.error);

    }

    return (
        <Layout>
            <div className="card">
                <div className="card-header">
                    <h4>We Emailed You </h4>
                    <h6>Your code is on the way. To log in, enter the code we emailed. It may take a minute to arrive.</h6>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label>Confirmation Code</label>
                            <input name="code" type="text" {...register('code')} className={`form-control ${errors.code ? 'is-invalid' : ''}`} />
                            <div className="invalid-feedback">{errors.code?.message}</div>
                        </div>

                        <div className="form-group">
                            <button type="submit" disabled={formState.isSubmitting} className="btn btn-primary mr-2">
                            {formState.isSubmitting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                Confirm
                            </button>
                            <button onClick={() => resend()} type="button" disabled={formState.isSubmitting} className="btn btn-secondary">Resend Code</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
