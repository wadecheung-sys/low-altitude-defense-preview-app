import type { AuthPermissionNode } from './types'

/** 与 LAD 业务菜单对齐的功能权限树（演示） */
export const LAD_PERMISSION_SEED: AuthPermissionNode[] = [
  {
    id: 'pm-root',
    parentId: null,
    name: '低空防御指挥控制平台',
    permCode: 'lad',
    nodeType: 'directory',
    sort: 0,
    status: 'enabled',
    children: [
      {
        id: 'pm-data-screen',
        parentId: 'pm-root',
        name: '数据大屏',
        permCode: 'lad:data-screen',
        nodeType: 'menu',
        path: '/lad/data-screen-nav',
        sort: 0,
        status: 'enabled',
        children: [
          {
            id: 'pm-data-screen-view',
            parentId: 'pm-data-screen',
            name: '查看',
            permCode: 'lad:data-screen:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-data-screen-control',
            parentId: 'pm-data-screen',
            name: '设备控制',
            permCode: 'lad:data-screen:control',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-incident',
        parentId: 'pm-root',
        name: '历史事件',
        permCode: 'lad:incident',
        nodeType: 'menu',
        path: '/lad/incident/history',
        sort: 1,
        status: 'enabled',
        children: [
          {
            id: 'pm-incident-view',
            parentId: 'pm-incident',
            name: '查看',
            permCode: 'lad:incident:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-incident-export',
            parentId: 'pm-incident',
            name: '导出',
            permCode: 'lad:incident:export',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          },
          {
            id: 'pm-incident-delete',
            parentId: 'pm-incident',
            name: '删除',
            permCode: 'lad:incident:delete',
            nodeType: 'button',
            sort: 3,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-list',
        parentId: 'pm-root',
        name: '黑白名单管理',
        permCode: 'lad:list',
        nodeType: 'menu',
        path: '/lad/list/index',
        sort: 2,
        status: 'enabled',
        children: [
          {
            id: 'pm-list-view',
            parentId: 'pm-list',
            name: '查看',
            permCode: 'lad:list:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-list-save',
            parentId: 'pm-list',
            name: '新增编辑',
            permCode: 'lad:list:save',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          },
          {
            id: 'pm-list-delete',
            parentId: 'pm-list',
            name: '删除',
            permCode: 'lad:list:delete',
            nodeType: 'button',
            sort: 3,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-flight-record',
        parentId: 'pm-root',
        name: '飞行记录',
        permCode: 'lad:flight-record',
        nodeType: 'menu',
        path: '/lad/flight-record/index',
        sort: 3,
        status: 'enabled',
        children: [
          {
            id: 'pm-flight-record-view',
            parentId: 'pm-flight-record',
            name: '查看',
            permCode: 'lad:flight-record:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-flight-record-playback',
            parentId: 'pm-flight-record',
            name: '回放演示',
            permCode: 'lad:flight-record:playback',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-device',
        parentId: 'pm-root',
        name: '设备管理',
        permCode: 'lad:device',
        nodeType: 'directory',
        sort: 4,
        status: 'enabled',
        children: [
          {
            id: 'pm-device-archive',
            parentId: 'pm-device',
            name: '设备档案',
            permCode: 'lad:device:archive',
            nodeType: 'menu',
            path: '/lad/device/archive',
            sort: 1,
            status: 'enabled',
            children: [
              {
                id: 'pm-device-archive-view',
                parentId: 'pm-device-archive',
                name: '查看',
                permCode: 'lad:device:archive:view',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              },
              {
                id: 'pm-device-archive-save',
                parentId: 'pm-device-archive',
                name: '维护',
                permCode: 'lad:device:archive:save',
                nodeType: 'button',
                sort: 2,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-device-info',
            parentId: 'pm-device',
            name: '设备信息',
            permCode: 'lad:device:info',
            nodeType: 'menu',
            path: '/lad/device/info/list',
            sort: 2,
            status: 'enabled',
            children: [
              {
                id: 'pm-device-info-view',
                parentId: 'pm-device-info',
                name: '查看',
                permCode: 'lad:device:info:view',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              },
              {
                id: 'pm-device-info-save',
                parentId: 'pm-device-info',
                name: '维护',
                permCode: 'lad:device:info:save',
                nodeType: 'button',
                sort: 2,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-device-group',
            parentId: 'pm-device',
            name: '设备组管理',
            permCode: 'lad:device:group',
            nodeType: 'menu',
            path: '/lad/device/group',
            sort: 4,
            status: 'enabled',
            children: [
              {
                id: 'pm-device-group-view',
                parentId: 'pm-device-group',
                name: '查看',
                permCode: 'lad:device:group:view',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              },
              {
                id: 'pm-device-group-save',
                parentId: 'pm-device-group',
                name: '维护',
                permCode: 'lad:device:group:save',
                nodeType: 'button',
                sort: 2,
                status: 'enabled'
              }
            ]
          }
        ]
      },
      {
        id: 'pm-area',
        parentId: 'pm-root',
        name: '区域管理',
        permCode: 'lad:area',
        nodeType: 'menu',
        path: '/lad/area/list',
        sort: 5,
        status: 'enabled',
        children: [
          {
            id: 'pm-area-view',
            parentId: 'pm-area',
            name: '查看',
            permCode: 'lad:area:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-area-save',
            parentId: 'pm-area',
            name: '绘制维护',
            permCode: 'lad:area:save',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-threat',
        parentId: 'pm-root',
        name: '威胁评估',
        permCode: 'lad:threat',
        nodeType: 'menu',
        path: '/lad/threat/index',
        sort: 6,
        status: 'enabled',
        children: [
          {
            id: 'pm-threat-view',
            parentId: 'pm-threat',
            name: '查看',
            permCode: 'lad:threat:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-threat-save',
            parentId: 'pm-threat',
            name: '配置',
            permCode: 'lad:threat:save',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-plan',
        parentId: 'pm-root',
        name: '预案策略配置',
        permCode: 'lad:plan',
        nodeType: 'menu',
        path: '/lad/plan/index',
        sort: 7,
        status: 'enabled',
        children: [
          {
            id: 'pm-plan-view',
            parentId: 'pm-plan',
            name: '查看',
            permCode: 'lad:plan:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-plan-save',
            parentId: 'pm-plan',
            name: '配置',
            permCode: 'lad:plan:save',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-message',
        parentId: 'pm-root',
        name: '消息中心',
        permCode: 'lad:message',
        nodeType: 'menu',
        path: '/lad/message/index',
        sort: 8,
        status: 'enabled',
        children: [
          {
            id: 'pm-message-view',
            parentId: 'pm-message',
            name: '查看',
            permCode: 'lad:message:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          },
          {
            id: 'pm-message-delete',
            parentId: 'pm-message',
            name: '删除',
            permCode: 'lad:message:delete',
            nodeType: 'button',
            sort: 2,
            status: 'enabled'
          }
        ]
      },
      {
        id: 'pm-system',
        parentId: 'pm-root',
        name: '系统管理',
        permCode: 'lad:system',
        nodeType: 'directory',
        sort: 9,
        status: 'enabled',
        children: [
          {
            id: 'pm-system-params',
            parentId: 'pm-system',
            name: '参数配置',
            permCode: 'lad:system:params',
            nodeType: 'menu',
            path: '/lad/system/params',
            sort: 1,
            status: 'enabled',
            children: [
              {
                id: 'pm-system-params-edit',
                parentId: 'pm-system-params',
                name: '编辑',
                permCode: 'lad:system:params:edit',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-system-dict',
            parentId: 'pm-system',
            name: '字典管理',
            permCode: 'lad:system:dict',
            nodeType: 'menu',
            path: '/lad/system/dict/list',
            sort: 2,
            status: 'enabled',
            children: [
              {
                id: 'pm-system-dict-save',
                parentId: 'pm-system-dict',
                name: '维护',
                permCode: 'lad:system:dict:save',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-system-diag',
            parentId: 'pm-system',
            name: '系统自诊断',
            permCode: 'lad:system:diagnostics',
            nodeType: 'menu',
            path: '/lad/system/diagnostics',
            sort: 3,
            status: 'enabled',
            children: [
              {
                id: 'pm-system-diag-run',
                parentId: 'pm-system-diag',
                name: '执行诊断',
                permCode: 'lad:system:diagnostics:run',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-system-sound',
            parentId: 'pm-system',
            name: '声光报警',
            permCode: 'lad:system:sound',
            nodeType: 'menu',
            path: '/lad/system/sound-alarm',
            sort: 4,
            status: 'enabled',
            children: [
              {
                id: 'pm-system-sound-save',
                parentId: 'pm-system-sound',
                name: '配置',
                permCode: 'lad:system:sound:save',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          }
        ]
      },
      {
        id: 'pm-auth',
        parentId: 'pm-root',
        name: '权限管理',
        permCode: 'lad:auth',
        nodeType: 'directory',
        sort: 10,
        status: 'enabled',
        children: [
          {
            id: 'pm-auth-user',
            parentId: 'pm-auth',
            name: '用户管理',
            permCode: 'lad:auth:user',
            nodeType: 'menu',
            path: '/lad/auth/user',
            sort: 1,
            status: 'enabled',
            children: [
              {
                id: 'pm-auth-user-save',
                parentId: 'pm-auth-user',
                name: '维护',
                permCode: 'lad:auth:user:save',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              },
              {
                id: 'pm-auth-user-reset',
                parentId: 'pm-auth-user',
                name: '重置密码',
                permCode: 'lad:auth:user:reset',
                nodeType: 'button',
                sort: 2,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-auth-perm',
            parentId: 'pm-auth',
            name: '功能权限',
            permCode: 'lad:auth:permission',
            nodeType: 'menu',
            path: '/lad/auth/permission',
            sort: 2,
            status: 'enabled',
            children: [
              {
                id: 'pm-auth-perm-edit',
                parentId: 'pm-auth-perm',
                name: '编辑',
                permCode: 'lad:auth:permission:edit',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-auth-role',
            parentId: 'pm-auth',
            name: '角色管理',
            permCode: 'lad:auth:role',
            nodeType: 'menu',
            path: '/lad/auth/role',
            sort: 3,
            status: 'enabled',
            children: [
              {
                id: 'pm-auth-role-save',
                parentId: 'pm-auth-role',
                name: '维护',
                permCode: 'lad:auth:role:save',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          },
          {
            id: 'pm-auth-log',
            parentId: 'pm-auth',
            name: '日志管理',
            permCode: 'lad:auth:log',
            nodeType: 'menu',
            path: '/lad/auth/log',
            sort: 4,
            status: 'enabled',
            children: [
              {
                id: 'pm-auth-log-view',
                parentId: 'pm-auth-log',
                name: '查看',
                permCode: 'lad:auth:log:view',
                nodeType: 'button',
                sort: 1,
                status: 'enabled'
              }
            ]
          }
        ]
      },
      {
        id: 'pm-integration',
        parentId: 'pm-root',
        name: '系统对接及算法服务',
        permCode: 'lad:integration',
        nodeType: 'menu',
        path: '/lad/integration/index',
        sort: 11,
        status: 'enabled',
        children: [
          {
            id: 'pm-integration-view',
            parentId: 'pm-integration',
            name: '查看',
            permCode: 'lad:integration:view',
            nodeType: 'button',
            sort: 1,
            status: 'enabled'
          }
        ]
      }
    ]
  }
]
