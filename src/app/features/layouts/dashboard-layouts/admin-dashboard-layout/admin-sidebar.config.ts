import {
    LayoutDashboard,
    Users,
    ShieldCheck, // Remplaçant de UserCheck, plus autoritaire
    Library,     // Remplaçant de Video, car l'admin gère un catalogue
    FolderOpen,
    Wallet,      // Remplaçant de CreditCard pour englober la finance globale
    MessageSquareWarning, // NOUVEAU : Pour la modération des avis
    BarChart3,
    Settings     // NOUVEAU : Paramètres de la plateforme
} from 'lucide-angular';

export const ADMIN_SIDEBAR_LINKS = [
    {
        labelKey: 'SIDEBAR.ADMIN.DASHBOARD',
        href: '/dashboard',
        icon: LayoutDashboard,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.INSTRUCTORS',
        href: '/admin/instructors',
        icon: ShieldCheck,
        requiresApproval: false,
        badgeKey: 'SIDEBAR.BADGES.ACTION' // Pour indiquer qu'il y a des validations en attente
    },
    {
        labelKey: 'SIDEBAR.ADMIN.USERS',
        href: '/admin/users',
        icon: Users,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.COURSES',
        href: '/admin/courses',
        icon: Library,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.CATEGORIES',
        href: '/admin/categories',
        icon: FolderOpen,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.FINANCE',
        href: '/admin/finance',
        icon: Wallet,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.REVIEWS',
        href: '/admin/reviews',
        icon: MessageSquareWarning,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.ADMIN.ANALYTICS',
        href: '/admin/analytics',
        icon: BarChart3,
        requiresApproval: false,
        dividerBefore: true
    },
    {
        labelKey: 'SIDEBAR.ADMIN.SETTINGS',
        href: '/admin/settings',
        icon: Settings,
        requiresApproval: false
    }
];