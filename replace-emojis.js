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

const baseDir = path.join(__dirname, 'src', 'app', '(dashboard)');

pages.forEach(p => {
    const file = path.join(baseDir, p, 'page.js');
    let content = fs.readFileSync(file, 'utf8');

    // Add lucide import
    if (!content.includes('lucide-react')) {
        content = content.replace("import dashStyles", "import { Pickaxe } from 'lucide-react';\nimport dashStyles");
        content = content.replace('<div style={{ fontSize: \'3rem\', marginBottom: \'1rem\' }}>🚧</div>', '<div style={{ display: \'flex\', justifyContent: \'center\', marginBottom: \'1rem\', color: \'var(--color-primary)\' }}><Pickaxe size={48} /></div>');
        fs.writeFileSync(file, content);
        console.log('Replaced in', p);
    }
});
