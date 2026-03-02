const fs = require('fs');
const path = require('path');

const pages = [
    'tenant/rentals',
    'tenant/maintenance',
    'tenant/messages',
    'tenant/profile',
    'landlord/tenants',
    'landlord/payments',
    'landlord/maintenance',
    'landlord/messages',
    'landlord/profile',
    'scout/leads',
    'scout/leads/new',
    'scout/earnings',
    'scout/profile',
    'affiliate/links',
    'affiliate/earnings',
    'affiliate/profile',
    'admin/rentals',
    'admin/escrow',
    'admin/commissions',
    'admin/disputes',
    'admin/settings'
];

const template = (title, upLevel) => `
import dashStyles from '${upLevel}tenant/dashboard.module.css';

export default function Page() {
    return (
        <div className="fade-in">
            <div className={dashStyles.header}>
                <h2>${title}</h2>
            </div>
            <div className="card mt-6" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
                <h3>Coming Soon in Phase 2</h3>
                <p className="text-muted mt-2">
                    This feature is currently under development. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
}
`;

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)');

pages.forEach(p => {
    const dir = path.join(baseDir, p);

    // Format title (e.g., 'scout/leads/new' -> 'New Leads')
    const parts = p.split('/');
    const title = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
    const finalTitle = title === 'New' ? 'Add New' : title;

    // Calculate relative path to `tenant/dashboard.module.css` (which is at depth 1 inside (dashboard))
    // e.g., 'tenant/rentals' -> depth 2. We need to go up 2 times to reach (dashboard), 
    // but wait! If we are in 'tenant/rentals/page.js', `../` is `tenant/rentals/`, `../../` is `tenant/`.
    // Wait, `page.js` is in `tenant/rentals`, so relative from `page.js` directory:
    // dirname is `tenant/rentals`. The target is `tenant/dashboard.module.css`.
    // We go from `tenant/rentals` to `tenant`: `../`
    // If dirname is `scout/leads/new`, target is `tenant/dashboard.module.css`.
    // `../` -> `scout/leads` -> `../../` -> `scout` -> `../../../` -> `(dashboard)`
    // So to `tenant/dashboard.module.css`: `../../../tenant/dashboard.module.css`
    const depth = parts.length;
    const upLevel = '../'.repeat(depth);

    const fileContent = template(finalTitle, upLevel);
    fs.writeFileSync(path.join(dir, 'page.js'), fileContent.trim());
    console.log('Fixed:', p, '->', upLevel);
});
