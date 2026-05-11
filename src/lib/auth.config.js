export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.adminRole = user.adminRole;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.ninStatus = user.ninStatus;
                token.status = user.status;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.adminRole = token.adminRole;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.ninStatus = token.ninStatus;
                session.user.status = token.status;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [], // Providers that require Node (like Credentials) are injected in auth.js
};
