import { repositories } from "../repositories";
import { useAppSelector } from "../state/appStore";

export function useAuth() {
  const session = useAppSelector((state) => state.session);

  const login = async (email: string, password: string) => {
    return repositories.auth.login(email, password);
  };

  const signup = async (input: {
    nickname: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    return repositories.auth.signup(input);
  };

  const logout = async () => {
    await repositories.auth.logout();
  };

  return {
    session,
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    login,
    signup,
    logout,
  };
}
