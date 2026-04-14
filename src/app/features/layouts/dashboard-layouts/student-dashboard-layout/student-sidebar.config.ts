import {
    LayoutDashboard,
    PlayCircle,
    Compass,
    Radio,
    MessageSquare,
    Award,
    Receipt,
    Settings,
    Heart
} from 'lucide-angular';

export const STUDENT_SIDEBAR_LINKS = [
    {
        labelKey: 'SIDEBAR.STUDENT.DASHBOARD',
        href: '/dashboard',
        icon: LayoutDashboard,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.STUDENT.MY_LEARNING',
        href: '/student/learning',
        icon: PlayCircle,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.STUDENT.CATALOG',
        href: '/courses',
        icon: Compass,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.STUDENT.FAVORITES',
        href: '/student/favorites',
        icon: Heart,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.STUDENT.LIVE_CLASSES',
        href: '/student/live-sessions',
        icon: Radio,
        requiresApproval: false,
        badgeKey: 'SIDEBAR.BADGES.SOON'
    },
    {
        labelKey: 'SIDEBAR.STUDENT.QNA',
        href: '/student/qna',
        icon: MessageSquare,
        requiresApproval: false,
        badgeKey: 'SIDEBAR.BADGES.SOON'
    },
    {
        labelKey: 'SIDEBAR.STUDENT.CERTIFICATES',
        href: '/student/certificates',
        icon: Award,
        requiresApproval: false,
        dividerBefore: true
    },
    {
        labelKey: 'SIDEBAR.STUDENT.PURCHASES',
        href: '/student/purchases',
        icon: Receipt,
        requiresApproval: false
    },
    {
        labelKey: 'SIDEBAR.STUDENT.SETTINGS',
        href: '/student/settings',
        icon: Settings,
        requiresApproval: false
    }
];