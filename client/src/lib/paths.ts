export const APPLICATION_PATHS = {
    DASHBOARD: "/",
    LOGIN: "/login",
    SIGNUP: "/signup",
};

export const API_PATHS = {
    SIGN_UP: "/api/auth/signup",
    LOGIN: "/api/auth/signin",
    LOGOUT: "/api/auth/logout",
    ME: '/api/auth/me',
    CREATE: '/api/projects',
    GETPROJECTS: '/api/projects',
    GET_PROJECTS_BY_ID:(id:string)=>`/api/projects/${id}`
};
