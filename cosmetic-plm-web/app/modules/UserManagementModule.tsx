type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active?: boolean;
};

type UserManagementModuleProps = {
  authUser: any;
  userProfile: UserProfile | null;
  getUserRole: () => string;
  tableStyle: React.CSSProperties;
};

export default function UserManagementModule({
  authUser,
  userProfile,
  getUserRole,
  tableStyle,
}: UserManagementModuleProps) {
  return (
    <>
      <h1>사용자관리</h1>
      <p>
        현재 로그인 사용자와 권한을 확인합니다. 권한 변경은 초기 버전에서는
        Supabase Table Editor의 user_profiles 또는 app_profiles에서 관리합니다.
      </p>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <th>이메일</th>
            <td>{authUser?.email}</td>
            <th>이름</th>
            <td>{userProfile?.display_name}</td>
          </tr>
          <tr>
            <th>권한</th>
            <td>{getUserRole()}</td>
            <th>상태</th>
            <td>{userProfile?.is_active === false ? "비활성" : "활성"}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}