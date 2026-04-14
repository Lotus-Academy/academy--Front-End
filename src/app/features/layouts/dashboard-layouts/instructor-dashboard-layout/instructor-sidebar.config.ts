import {
    LayoutDashboard,
    BookOpen,
    PlusCircle,
    GraduationCap,
    Radio,
    LineChart,
    MessageSquare,
    UserCircle,
    Settings
} from 'lucide-angular';

export interface SidebarLink {
    labelKey: string;
    href: string;
    icon: any;
    requiresApproval: boolean;
    dividerBefore?: boolean;
    badgeKey?: string; //Pour afficher "BETA" ou "SOON"
    isDisabled?: boolean;
}

export const INSTRUCTOR_SIDEBAR_LINKS: SidebarLink[] = [
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.DASHBOARD',
        href: '/dashboard',
        icon: LayoutDashboard,
        requiresApproval: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.MY_COURSES',
        href: '/instructor/courses',
        icon: BookOpen,
        requiresApproval: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.CREATE_COURSE',
        href: '/instructor/courses/new',
        icon: PlusCircle,
        requiresApproval: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.LIVE_SESSIONS',
        href: '/instructor/live-sessions',
        icon: Radio,
        requiresApproval: true,
        badgeKey: 'SIDEBAR.BADGES.SOON'
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.STUDENTS',
        href: '/instructor/students',
        icon: GraduationCap,
        requiresApproval: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.EARNINGS',
        href: '/instructor/earnings',
        icon: LineChart,
        requiresApproval: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.MENTORING',
        href: '/instructor/mentoring',
        icon: MessageSquare,
        requiresApproval: true,
        badgeKey: 'SIDEBAR.BADGES.BETA',
        isDisabled: true
    },
    {
        labelKey: 'SIDEBAR.INSTRUCTOR.PROFILE',
        href: '/instructor/profile',
        icon: UserCircle,
        requiresApproval: false,
        dividerBefore: true
    }
    //,
    //{
    //    labelKey: 'SIDEBAR.INSTRUCTOR.SETTINGS',
    //    href: '/instructor/settings',
    //    icon: Settings,
    //    requiresApproval: false
    //}
];