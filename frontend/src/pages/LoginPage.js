import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <AuthForm isLogin={true} />
    </div>
  );
};

export default LoginPage;