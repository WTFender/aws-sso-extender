<!-- eslint-disable vue/max-len -->
<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <PToolbar style="padding: .5rem; height: 45px; margin: 0px; display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap;">
    <template
      v-if="permissions.sso && loaded"
      #start
    >
      <PrimeButton
        id="options"
        text
        class="toolbar-item user-button"
        :label="(!settings.tableSettings.showIamRoles || !settings.tableSettings.showIcon) ? '' : user.custom.displayName || user.subject"
        icon="pi pi-cog"
        size="small"
        :style="{ width: (!settings.tableSettings.showIamRoles || !settings.tableSettings.showIcon) ? '40px' : users.length > 1 ? '160px' : '200px' }"
        @click="$ext.config.browser.runtime.openOptionsPage()"
      />
      <PrimeButton
        v-if="users.length > 1"
        text
        class="toolbar-item user-button"
        icon="pi pi-users"
        size="small"
        style="width: 40px; margin-left: .25rem;"
        @click="nextUser()"
      />
    </template>
    <template
      v-if="permissions.sso && loaded"
      #center
    >
      <div v-if="page === 'settings'">
        <div class="py-2">
          <PrimeButton
            v-for="tab in tabs"
            :key="tab.index"
            style="padding: 5px; margin: 0px"
            :text="activeTab !== tab.index"
            size="small"
            :label="tab.label"
            @click="activeTab = tab.index"
          />
        </div>
      </div>
      <span
        v-else
        class="p-input-icon-left"
        style="margin: 0px"
      >
        <i class="pi pi-search" />
        <InputText
          id="searchBox"
          ref="searchBox"
          v-model="search"
          autofocus
          class="toolbar-item"
          :placeholder="!settings.tableSettings.showIamRoles && !settings.tableSettings.showIcon ? 'Search' : 'Search Profiles'"
          size="small"
          :style="{ width: searchBoxWidth, fontSize: '12px', 'padding-left': '2.5rem !important' }"
        />
      </span>
    </template>
    <template
      v-else
      #center
    >
      <h3>AWS SSO Extender - Setup</h3>
    </template>
    <template #end>
      <PrimeButton
        v-if="!permissions.sso || !loaded"
        size="small"
        icon="pi pi-play"
        class="p-button-success toolbar-item"
        label="Demo"
        @click="demo()"
      />
      <div v-else>
        <ToggleButton
          v-model="tableEditor"
          :disabled="settingsPage"
          class="toolbar-item"
          style="width: 40px; margin-right: .25rem;"
          on-label=""
          off-label=""
          on-icon="pi pi-pencil"
          off-icon="pi pi-pencil"
          size="small"
        />
        <ToggleButton
          v-model="favorites"
          :disabled="settingsPage || tableEditor"
          class="toolbar-item"
          style="width: 40px;"
          on-label=""
          off-label=""
          on-icon="pi pi-star"
          off-icon="pi pi-star"
          size="small"
        />
      </div>
    </template>
  </PToolbar>

  <div
    class="card"
    :style="{ height: tableEditor ? '500px' : '', width: windowSize }"
  >
    <!--- Setup -->
    <SetupSteps
      v-show="!permissions.sso || !loaded"
      style="margin-top: 10px"
      :permissions="permissions"
      :loaded="loaded"
    />

    <!--- Profiles -->
    <ProfileTable
      v-if="!settingsPage"
      :loaded="loaded"
      :table-editor="tableEditor"
      :demo-mode="demoMode"
      :settings="settings"
      :search="search"
      :app-profiles="favorites ? faveProfiles : userProfiles"
      :user="user"
      :users="users"
      :permissions="permissions"
      @focusSearchBox="focusSearchBox"
      @requestPermissions="requestPermissionsSwitchrole"
      @saveUser="saveUser"
      @updateProfile="updateProfile"
      @updateProfileLabel="updateProfileLabel"
      @updateTableSettings="updateTableSettings"
    />
  </div>

  <!--- Footer -->
  <div :class="$ext.config.debug ? 'footer-debug' : 'footer'">
    <p
      v-if="$ext.config.debug"
      style="margin: 0px"
    >
      {{ `${$ext.config.debug ? 'dev' : 'prod'}-${$ext.config.version}-${$ext.config.build}` }}
    </p>
  </div>
</template>
<script lang="ts">
import { waitForElement } from '../utils';
import demoData from '../demo';
import {
  AppData,
  CustomData,
  ExtensionData,
  ExtensionSettings,
  UserData,
} from '../types';

export default {
  name: 'PopupView',
  data() {
    return {
      profileHotkeys: [],
      profileEditor: false,
      settingsPage: false,
      favorites: false,
      tabs: [
        { index: 0, label: 'Users' },
        { index: 1, label: 'Console' },
        { index: 2, label: 'Roles' },
        { index: 3, label: 'Settings' },
      ],
      activeTab: 0,
      search: '',
      tableEditor: false,
      raw: {} as ExtensionData,
      demoMode: false,
      permissions: {
        history: false,
        console: false,
        signin: false,
        sso: false,
        containers: false,
      },
      loaded: false,
      user: {
        custom: {},
      } as UserData,
      users: [] as UserData[],
      settings: {
        defaultUser: 'lastUserId',
        lastUserId: '',
        lastProfileId: '',
        firefoxContainers: false,
        firefoxResumeContainer: true,
        navCurrentTab: false,
        showReleaseNotes: true,
        showAllProfiles: false,
        tableSettings: {
          showAllUsers: false,
          showIamRoles: true,
          showIcon: true,
          sortCustom: false,
          sortApp: 'desc',
          sortProfile: false,
        },
      } as ExtensionSettings,
      appProfiles: [] as AppData[],
      dataJson: '',
      lastPage: 'profiles',
      page: '', // profiles, favorites, users
      updatedAt: 0,
    };
  },
  computed: {
    searchBoxWidth() {
      if (!this.settings.tableSettings.showIcon && !this.settings.tableSettings.showIamRoles) {
        return '135px';
      }
      return '235px';
    },
    windowSize() {
      if (!this.loaded || this.page === 'settings' || this.profileEditor) {
        return '580px';
      }
      if (!this.settings.tableSettings.showIcon && !this.settings.tableSettings.showIamRoles) {
        return '380px';
      }
      if (!this.settings.tableSettings.showIcon || !this.settings.tableSettings.showIamRoles) {
        return '480px';
      }
      return '580px';
    },
    userOptions() {
      const options = this.users.map((user: UserData) => ({
        ...user,
        label: `${user.custom.displayName || user.subject} @ ${user.managedActiveDirectoryId}${user.custom.displayName ? ` (${user.subject})` : ''}`,
        command: () => {
          this.user = user;
        },
      }));
      return options;
    },
    faveProfiles(): AppData[] {
      // favorite & not hidden
      return this.userProfiles.filter(
        (ap: AppData) => ap.profile.custom?.favorite === true && ap.profile.custom?.hide === false,
      );
    },
    userProfiles() {
      this.$ext.log(this.user);
      if (this.user === null) {
        return [];
      }
      // if show all user profiles is enabled, return all profiles
      if (this.settings.tableSettings.showAllUsers) {
        return this.appProfiles;
      }
      // eslint-disable-next-line vue/max-len
      return this.appProfiles.filter((ap: AppData) => this.user.appProfileIds.includes(ap.profile.id));
    },
  },
  watch: {
    favorites: {
      handler(v) {
        this.$ext.log(`popup:favorites:${v}`);
        this.focusSearchBox();
      },
    },
    tableEditor: {
      handler(v) {
        this.$ext.log(`popup:tableEditor:${v}`);
        if (v === true) {
          this.favorites = false;
        } else {
          this.focusSearchBox();
        }
      },
    },
    settingsPage: {
      handler(v) {
        this.$ext.log(`popup:settingsPage:${v}`);
        if (v === true) {
          this.setPage('settings');
        } else {
          this.setPage('profiles');
        }
      },
    },
    page: {
      handler(v) {
        this.lastPage = v;
        if (v === 'settings') {
          // clear profile table selection
          this.tableEditor = false;
        }
        if (v === 'profiles' || v === 'favorites') {
          this.focusSearchBox();
        }
      },
    },
    'user.custom.displayName': {
      handler(v) {
        this.$ext.log(`popup:user.custom.displayName:${v}`);
        this.saveUser();
      },
    },
    'settings.enableSync': {
      handler(enableSync) {
        this.$ext.log(`popup:settings.enableSync:${enableSync}`);
        this.users.forEach((u) => {
          this.$ext.saveUser(u, enableSync);
        });
      },
    },
    'settings.iconColor': {
      handler(color) {
        this.$ext.log(`popup:settings.iconColor:${color}`);
        this.$ext.config.browser.action.setIcon({ path: `/icons/${color}/128.png` });
        this.$ext.saveSettings(this.settings);
      },
    },
    'settings.firefoxContainers': {
      handler(v) {
        if (this.$ext.platform === 'firefox') {
          this.$ext.log(`popup:settings.firefoxContainers:${v}`);
          if (v === true) {
            this.$ext.config.browser.runtime.sendMessage({
              action: 'enableFirefoxContainers',
            });
          } else if (v === false) {
            this.$ext.config.browser.runtime.sendMessage({
              action: 'disableFirefoxContainers',
            });
          }
        }
      },
    },
    settings: {
      handler() {
        if (!this.demoMode) {
          this.$ext.saveSettings(this.settings);
        }
      },
      deep: true,
    },
    user() {
      if (this.user === null) {
        this.user = this.$ext.getDefaultUser(this.raw);
      }
      this.settings.lastUserId = this.user.userId;
      this.refreshProfiles();
      // this.reload();
    },
    loaded(v) {
      this.$ext.log(`popup:loaded:${v}`);
      this.$ext.log(this.settings.showAllProfiles);
      if (v === true) {
        if (this.settings.showAllProfiles || this.faveProfiles.length === 0) {
          this.favorites = false;
        } else if (this.faveProfiles.length >= 1) {
          this.favorites = true;
        }
      }
    },
  },
  created() {
    this.$ext.config.browser.permissions.onAdded.addListener(this.handlePermissions);
    // eslint-disable-next-line func-names
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
    });
    this.getProfileHotkeys();
    this.reload();
  },
  methods: {
    nextUser() {
      const options = this.userOptions;
      const currentUserIdx = options.findIndex((u) => u.userId === this.user.userId);
      this.user = options[currentUserIdx + 1] || options[0];
    },
    async getProfileHotkeys() {
      this.profileHotkeys = await this.$ext.config.browser.commands.getAll().then((commands) => {
        this.$ext.log(commands);
        return commands.filter((command) => command.name.startsWith('openProfile'));
      });
      this.$ext.log('popup:getProfileHotkeys');
      this.$ext.log(this.profileHotkeys);
    },
    focusSearchBox() {
      waitForElement('#searchBox').then((searchBox) => {
        searchBox.focus();
      });
    },
    updateTableSettings(tableSettings) {
      this.profileEditor = tableSettings.profileEditor;
      delete tableSettings.profileEditor;
      this.settings.tableSettings = tableSettings;
    },
    requestPermissionsSwitchrole() {
      this.$ext.config.browser.permissions.request({
        origins: [
          ...this.$ext.config.permissions.console,
          ...this.$ext.config.permissions.signin,
        ],
      });
      window.close();
    },
    refreshProfiles() {
      this.appProfiles = [];
      this.appProfiles = this.$ext.customizeProfiles(this.user, this.raw.appProfiles);
      this.loaded = true;
    },
    demo() {
      this.$ext.log('popup:demoMode');
      this.demoMode = true;
      this.permissions = {
        console: true,
        history: true,
        signin: true,
        sso: true,
        containers: true,
      };
      this.load(demoData);
    },
    load(data: ExtensionData) {
      this.raw = data;
      this.dataJson = JSON.stringify(data, null, 2);
      this.settings = data.settings;
      this.users = data.users;
      if (this.users.length > 0) {
        this.updatedAt = data.updatedAt as number;
        if (!this.loaded || !this.user) {
          this.user = this.$ext.getDefaultUser(data);
        } else {
          // eslint-disable-next-line prefer-destructuring
          this.user = data.users.filter((u) => u.userId === this.user.userId)[0];
        }
        // profiles are refreshed/customized on user change
      }
    },
    reload() {
      if (this.demoMode) {
        this.settings = demoData.settings;
        this.users = demoData.users;
        this.appProfiles = demoData.appProfiles;
        if (this.user.userId !== 'demoUserId1') {
          // eslint-disable-next-line prefer-destructuring
          this.user = demoData.users[0];
        }
      } else {
        this.$ext
          .loadData()
          .then((data) => {
            this.load(data);
          })
          .catch((error) => {
            throw error;
          });
      }
    },
    handlePermissions() {
      this.$ext.checkPermissions().then((perms) => {
        this.permissions = perms;
        this.$ext.log(this.permissions);
      });
    },
    setPage(page) {
      this.$ext.log(page);
      this.$ext.log(`popup:page:${page}`);
      this.page = page;
    },
    updateProfile(appProfile: AppData) {
      this.$ext.log('popup:updateProfile');
      this.user.custom.profiles[appProfile.profile.id] = appProfile.profile
        .custom as CustomData;
      this.$ext.log(this.user);
      if (this.faveProfiles.length === 0) {
        this.setPage('profiles');
      }
      this.saveUser();
    },
    saveUser() {
      if (!this.demoMode && this.user.userId !== 'demoUserId1') {
        this.$ext.saveUser(this.user, this.settings.enableSync).then(() => {
          this.reload();
        });
      }
    },
    updateProfileLabel(event) {
      const { newData } = event;
      if ('profile.custom.label' in newData) {
        newData.profile.custom.label = newData['profile.custom.label'];
      }
      if ('profile.custom.color' in newData) {
        newData.profile.custom.color = newData['profile.custom.color'];
      }
      this.updateProfile(newData);
    },
  },
};
</script>

<style lang="scss" scoped>
.toolbar-item {
  font-size: 12px;
  height: 30px;
  background: #ffffff;
  color: #343a40 !important;
  border: 1px solid #ced4da;
}
.user-button:hover {
  background: #eeeeee !important;
  color: #343a40 !important;
  border: 1px solid #ced4da !important;
}
::v-deep(.p-scrollpanel.scroll .p-scrollpanel-wrapper) {
  border-right: 10px solid var(--surface-50);
  border-bottom: 10px solid var(--surface-50);
}

::v-deep(.p-scrollpanel.scroll .p-scrollpanel-bar) {
  background-color: var(--surface-300);
  border-radius: 0;
  opacity: 1;
  transition: background-color 0.3s;
}

.p-rowgroup-footer td {
  font-weight: 700;
}

::v-deep(.p-rowgroup-header) {
  span {
    font-weight: 700;
  }

  .p-row-toggler {
    vertical-align: middle;
    margin-right: 0.25rem;
  }
}

.setup-done {
  color: green;
}

.setup-pending {
  color: orange;
}

.card {
  background-color: white;
  max-height: 500px;
  display: inline-block;
  margin: 0px;
  padding: 0px;
  padding-bottom: 3px;
  border: none;
}
.menu-icon {
  font-size: 1.75rem;
  color: #dee2e6;
}

.page-icon {
  font-size: 1.75rem;
  color: #dee2e6;
  position: absolute;
  top: 20px;
}

.page-active {
  color: #343a40;
}

.page-icon:hover {
  color: #343a40;
  cursor: pointer;
}

.page-icon.disabled:hover {
  color: #dee2e6;
  cursor: inherit;
}

.footer, .footer-debug {
  color: #343a40;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  position: fixed;
  bottom: 0px;
  left: 0px;
  right: 0px;
  overflow: hidden;
  text-align: center;
}

.footer {
  height: 5px;
}

.footer-debug {
  height: 20px;
}

.json,
.settings {
  margin: 15px;
}
.setting-label,
.setting-checkbox {
  margin-right: 10px;
  margin-bottom: 5px;
  margin-top: 5px;
  vertical-align: middle;
}
.p-inputtext {
  padding: 5px !important;
}

</style>
