<!-- eslint-disable vue/max-len -->
<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <PToolbar style="height: 45px; margin: 0px; display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap;">
    <template #center>
      <PSplitButton
        v-if="users.length > 1"
        class="user-button menu-button"
        :label="userLabel"
        icon="pi pi-users"
        size="small"
        :model="userOptions"
        @click="$ext.browser.runtime.openOptionsPage()"
      />
      <PrimeButton
        v-else
        class="user-button menu-button"
        :label="userLabel"
        icon="pi pi-user"
        size="small"
        @click="$ext.browser.runtime.openOptionsPage()"
      />
      <PrimeButton
        icon="pi pi-download"
        class="p-button-primary menu-button"
        label="Export"
        style="margin-right: 5px; margin-left: 20px;"
        size="small"
        @click="exportUser()"
      />
      <PrimeButton
        icon="pi pi-trash"
        class="p-button-danger menu-button reset-button"
        label="Reset"
        style="margin-right: 5px"
        size="small"
        @click="resetCustom()"
      /><br>
    </template>
    <template #end>
      <PrimeButton outlined class="menu-button reset-button" severity="secondary" icon="pi pi-code" @click="viewJson = !viewJson" />
    </template>
  </PToolbar>

  <div v-if="viewJson">
    {{ dataJson }}
  </div>
  <div class="options-parent">
    <div class="options-group">
      <h2>Extension Settings</h2>
      <small class="option-label">Default User</small>
      <select
        id="defaultUserSelect"
        name="defaultUserSelect"
        style="margin-bottom: 10px; margin-left: 20px;"
        @change="setDefaultUser($event)"
      >
        <option
          v-for="u in defaultUserOptions"
          :key="u.userId"
          :label="u.label"
          :value="u.userId"
          :selected="u.userId === settings.defaultUser"
        />
      </select>
      <form class="option-label" style="margin-bottom: 20px;">
        <div name="iconColor" class="p-checkbox p-component p-checkbox-disabled" style="margin-right: 10px; margin-top: 5px; margin-bottom: 5px; vertical-align: middle;">
          <div class="p-hidden-accessible">
            <input type="checkbox" disabled>
          </div><div class="p-checkbox-box p-disabled" :style="{ 'background-color': hexColors[settings.iconColor] }">
            <span class="p-checkbox-icon" />
          </div>
        </div>
        <label v-tooltip.bottom="'Extension icon color'" for="iconColor" style="margin-right: 10px;">Icon Color</label>
        <select
          v-model="settings.iconColor"
          style="margin-bottom: 5px;"
        >
          <option
            v-for="c in ['red', 'blue', 'green', 'purple']"
            :key="c + 'icon'"
            :label="c"
            :value="c"
          />
        </select>
        <div v-for="setting in settingOptions" :key="setting.id">
          <PCheckbox
            v-model="settings[setting.id]"
            :input-id="setting.id"
            :name="setting.id"
            :binary="true"
            style="margin-right: 10px; margin-top: 5px; margin-bottom: 5px; vertical-align: middle;"
          />
          <label v-tooltip.bottom="setting.tooltip" :for="setting.id">{{ setting.label }}</label>
        </div>
      </form><br>
      <div v-for="res in resources" :key="res.label" class="option-label">
        <PrimeButton
          raised
          size="small"
          :icon="'pi ' + res.icon"
          :label="res.label"
          :severity="res.severity"
          @click="openResource(res.url)"
        />
      </div>
    </div>
    <div class="options-group">
      <div>
        <h2>User Settings</h2>
        <small class="option-label">Display Name</small><br>
        <InputText
          id="displayName"
          v-model="user.custom.displayName"
          name="displayName"
          class="p-inputtext-sm option-value"
          style="width: 350px;"
          :placeholder="user.subject"
        /><br>
        <small v-tooltip.bottom="$ext.platform === 'firefox' ? 'Customize key binds @ about:addons' : 'Customize key binds @ chrome://extensions/shortcuts'" class="option-label">Profile Hotkeys</small><br>
        <div class="option-label">
          <form style="margin-left: 20px;">
            <div v-for="hotkey in profileHotkeys" :key="hotkey['name']">
              <code>{{ hotkey['shortcut'] }}</code><select
                style="margin-bottom: 10px; margin-left: 20px;"
                @change="setHotkeyProfileId($event, hotkey['name'])"
              >
                <option
                  v-for="p in awsAppProfiles"
                  :key="p.profile.id"
                  :label="p.label"
                  :value="p.profile.id"
                  :selected="p.profile.id === user.custom.hotkeys[hotkey['name']]"
                />
              </select>
              <br />
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="options-group">
      <div>
        <div v-if="!consolePermissions">
          <p>This extension requires permissions to customize the AWS console:</p>
          <code>https://*.console.aws.amazon.com/*</code><br />
          <PrimeButton
            size="small"
            icon="pi pi-lock"
            class="p-button-success"
            label="Request Permissions"
            style="margin-top: 10px"
            @click="requestPermissionsConsole()"
          />
        </div>
        <div v-else>
          <h2>
            AWS Console Settings
          </h2>
          <form class="option-label">
            <div>
              <div v-if="$ext.platform === 'firefox'">
                <PCheckbox
                  v-model="settings.firefoxContainers"
                  input-id="container"
                  name="container"
                  :binary="true"
                  style="margin-right: 10px; text-align: middle"
                  @click="toggleContainers()"
                />
                <label for="container">Open in Firefox Containers</label><br /><br />
              </div>
              <small id="sso-label">SSO Console Label</small>
              <br />
              <InputText
                id="sessionLabelSso"
                v-model="user.custom.sessionLabelSso"
                aria-describedby="sso-label"
                name="sessionLabelSso"
                class="p-inputtext-sm"
                style="width: 350px; margin-right: 10px"
                :placeholder="user.custom.sessionLabelSso"
              />
            </div>
            <br />
            <div>
              <small id="iam-label">IAM Console Label</small>
              <br />
              <InputText
                id="sessionLabelIam"
                v-model="user.custom.sessionLabelIam"
                aria-describedby="iam-label"
                name="sessionLabelIam"
                class="p-inputtext-sm"
                style="width: 350px; margin-right: 10px; margin-bottom: 5px;"
                :placeholder="user.custom.sessionLabelIam"
              />
            </div>
            <details>
              <summary>Use variables in your labels</summary>
              <br />
              <code>{{ "\{\{user\}\}        Current AWS SSO user" }} </code><br />
              <code>{{ "\{\{role\}\}        Current IAM role" }} </code><br />
              <code>{{ "\{\{profile\}\}     Current AWS SSO profile" }} </code><br />
              <code>{{ "\{\{account\}\}     Current AWS account ID" }} </code><br />
              <code>{{ "\{\{accountName\}\} Current AWS account alias" }} </code><br />
            </details>
            <br />
            <div style="width: 40%; float: left">
              <PCheckbox
                v-model="user.custom.labelHeader"
                input-id="labelHeader"
                name="labelHeader"
                :binary="true"
                class="setting-checkbox"
              />
              <label for="labelHeader" class="setting-label">Label header</label><br />
              <PCheckbox
                v-model="user.custom.labelFooter"
                input-id="labelFooter"
                name="labelFooter"
                :binary="true"
                class="setting-checkbox"
              />
              <label for="labelFooter" class="setting-label">Label footer</label>
            </div>
            <div>
              <PCheckbox
                v-model="user.custom.colorHeader"
                input-id="colorHeader"
                name="colorHeader"
                :binary="true"
                class="setting-checkbox"
              />
              <label for="colorHeader" class="setting-label">Colorize header</label><br />
              <PCheckbox
                v-model="user.custom.colorFooter"
                input-id="colorFooter"
                name="colorFooter"
                :binary="true"
                class="setting-checkbox"
              />
              <label for="colorFooter" class="setting-label">Colorize footer</label>
            </div>
            <PCheckbox
              v-model="user.custom.labelIcon"
              input-id="labelIcon"
              name="labelIcon"
              :binary="true"
              class="setting-checkbox"
            />
            <label for="labelIcon" class="setting-label">Show icon in label</label>
            <br />
            <div style="margin-bottom: 10px; margin-top: 5px;">
              <ColorPicker
                id="colorDefault"
                v-model="user.custom.colorDefault"
                input-id="colorDefault"
                name="colorDefault"
                @click.prevent="colorPickerVisible = !colorPickerVisible"
              />
              <label for="colorDefault"> Default AWS Console color</label>
            </div>
            <!---
                  Colorpicker, dropdowns, and certain other elements won't stay open on firefox
                  Workaround is to render our own dialog box on firefox with the elements
                -->
            <PDialog v-if="$ext.platform === 'firefox' || $ext.platform === 'safari'" v-model:visible="colorPickerVisible" :style="{ width: '50vw' }">
              <ColorPicker v-if="colorPickerVisible" v-model="user.custom.colorDefault" :inline="true" />
            </PDialog><br />
            <PrimeButton
              ref="saveConsoleBtn"
              size="small"
              icon="pi pi-save"
              class="p-button-primary"
              label="Save"
              style="margin-right: 10px"
              @click="saveConsoleSettings()"
            />
          </form>
        </div>
      </div>
    </div>
    <div class="options-group">
      <div v-if="!permissions.console || !permissions.signin">
        <p>
          In order to switch IAM roles, this extension requires permissions to the AWS
          console.
        </p>
        <code>https://*.console.aws.amazon.com/*</code><br />
        <code>https://signin.aws.amazon.com/switchrole</code>
        <PrimeButton
          size="small"
          icon="pi pi-lock"
          class="p-button-success"
          label="Request Permissions"
          style="margin-top: 10px"
          @click="requestPermissionsSwitchrole()"
        />
      </div>
      <IamRoles
        v-else
        :app-profiles="userProfiles"
        :aws-app-profiles="awsAppProfiles"
        @addIamRole="addIamRole"
        @updateProfile="updateProfile"
        @saveUser="saveUser"
      />
    </div>
  </div>
  <!--- Footer -->
  <div :class="$ext.config.debug ? 'footer-debug' : 'footer'">
    <p v-if="$ext.config.debug" style="margin: 0px">
      {{ `${$ext.config.debug ? 'dev' : 'prod'}-${$ext.config.version}-${$ext.config.build}` }}
    </p>
  </div>
</template>
<script lang="ts">
import { saveAs } from 'file-saver';
import demoData from '../demo';
import {
  AppData,
  CustomData,
  ExtensionData,
  ExtensionSettings,
  IamRole,
  UserData,
} from '../types';

export default {
  name: 'OptionsView',
  data() {
    return {
      viewJson: false,
      items: [
        { label: 'New', icon: 'pi pi-plus' },
        { label: 'Search', icon: 'pi pi-search' },
      ],
      hexColors: {
        red: '#de2d35',
        blue: '#24b0ff',
        green: '#22C55E',
        purple: '#6466f1',
      },
      profileHotkeys: [],
      settingOptions: [
        { label: 'Show All Profiles on Open', id: 'showAllProfiles', tooltip: 'Show all profiles when opening the extension popup, instead of filtering to favorites (default: false)' },
        { label: 'Show Release Notes on Update', id: 'showReleaseNotes', tooltip: 'When the extension is updated, open a browser tab with a link to the release notes (default: true)' },
        { label: 'Sync User Settings', id: 'enableSync', tooltip: 'Sync user settings across browsers. (default: true)' },
      ],
      resources: [
        {
          icon: 'pi-plus-circle', severity: 'primary', label: 'Request a Feature', url: 'https://github.com/WTFender/aws-sso-extender/issues/new?assignees=&labels=enhancement&projects=&template=FEATURE.yml',
        },
        {
          icon: 'pi-exclamation-triangle', severity: 'warning', label: 'Report a Bug', url: 'https://github.com/WTFender/aws-sso-extender/issues/new?assignees=&labels=bug&projects=&template=BUG-REPORT.yml',
        },
        {
          icon: 'pi-info-circle', severity: 'secondary', label: 'Release Notes', url: `https://github.com/WTFender/aws-sso-extender/releases/tag/v${this.$ext.config.browser.runtime.getManifest().version}`,
        },
      ],
      importUser: false,
      raw: {} as ExtensionData,
      colorPickerVisible: false,
      demoMode: false,
      permissions: {
        history: false,
        console: false,
        signin: false,
        sso: false,
        containers: false,
      },
      user: {
        custom: {},
      } as UserData,
      users: [] as UserData[],
      settings: {
        defaultUser: 'lastUserId',
        lastUserId: '',
        lastProfileId: '',
        firefoxContainers: false,
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
      updatedAt: 0,
      loaded: false,
    };
  },
  computed: {
    userLabel() {
      return this.user.custom.displayName || this.user.subject;
    },
    consolePermissions() {
      if (this.$ext.platform === 'firefox') {
        return this.permissions.console && this.permissions.containers;
      }
      return this.permissions.console;
    },
    defaultUserOptions() {
      let options = [{ userId: 'lastUserId', label: 'Last sign-in activity' }];
      options = options.concat(this.userOptions);
      return options;
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
    awsAppProfiles(): AppData[] {
      const appProfiles = this.appProfiles.filter((ap) => (ap as AppData).applicationName === 'AWS Account') as AppData[];
      // eslint-disable-next-line no-param-reassign
      appProfiles.forEach((ap) => { ap.label = `${ap.searchMetadata!.AccountId} (${ap.searchMetadata!.AccountName}) - ${ap.profile.name} (${ap.profile.custom?.iamRoles.length})`; });
      this.$ext.log(appProfiles);
      return appProfiles;
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
    async getProfileHotkeys() {
      this.profileHotkeys = await this.$ext.config.browser.commands.getAll().then((commands) => {
        this.$ext.log(commands);
        return commands.filter((command) => command.name.startsWith('openProfile'));
      });
      this.$ext.log('popup:getProfileHotkeys');
      this.$ext.log(this.profileHotkeys);
    },
    openResource(url) {
      window.open(url, '_blank');
    },
    importUserConfig() {
      const configJson = (this.$refs.configJson as any).innerText;
      if (this.$ext.importUserConfig(configJson)) {
        this.importUser = false;
        this.reload();
      } else {
        (this.$refs.configError as any).style.display = 'block';
      }
    },
    exportUser() {
      const fileToSave = new Blob([this.dataJson], {
        type: 'application/json',
      });
      saveAs(fileToSave, `${this.user.custom.displayName || this.user.subject}-${this.$ext.config.name}.json`);
    },
    toggleContainers() {
      this.settings.firefoxContainers = !this.settings.firefoxContainers;
    },
    requestPermissionsContainers() {
      this.$ext.config.browser.permissions.request({
        origins: [
          ...this.$ext.config.permissions.console,
          ...this.$ext.config.permissions.containers,
        ],
        permissions: [
          'activeTab',
          'tabs',
          'webRequest',
          'webRequestBlocking',
          'webRequestFilterResponse',
        ],
      });
      window.close();
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
    requestPermissionsConsole() {
      if (this.$ext.platform === 'firefox') {
        this.$ext.log('popup:requestPermissionsContainers');
        this.requestPermissionsContainers();
      } else {
        this.$ext.log('popup:requestPermissionsConsole');
        this.$ext.config.browser.permissions.request({
          origins: [...this.$ext.config.permissions.console],
        });
        window.close();
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHotkeyProfileId(event: any, hotkeyId: string) {
      this.$ext.log(`popup:setHotkeyProfileId:${hotkeyId}:${event.target.value}`);
      this.user.custom.hotkeys[hotkeyId] = event.target.value;
      this.saveUser();
    },
    setDefaultUser(userId: any) {
      if (userId.target instanceof Element) {
        this.settings.defaultUser = userId.target.value;
      } else {
        this.settings.defaultUser = userId;
      }
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
    resetCustom() {
      this.user.custom = this.$ext.defaultCustom;
      this.$ext.saveUser(this.user, this.settings.enableSync).then(() => {
        window.close();
      });
    },
    updateProfile(appProfile: AppData) {
      this.$ext.log('popup:updateProfile');
      this.user.custom.profiles[appProfile.profile.id] = appProfile.profile
        .custom as CustomData;
      this.$ext.log(this.user);
      this.saveUser();
    },
    saveConsoleSettings() {
      const saveConsoleBtn = (this.$refs.saveConsoleBtn as any).$el as HTMLInputElement;
      saveConsoleBtn.disabled = true;
      setTimeout(() => {
        saveConsoleBtn.disabled = false;
      }, 1000);
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
    addIamRole(role: IamRole) {
      this.$ext.log('popup:addIamRole');
      if (role.profileId in this.user.custom.profiles) {
        this.user.custom.profiles[role.profileId].iamRoles.push(role);
      } else {
        this.user.custom.profiles[role.profileId] = {
          color: '',
          label: null,
          favorite: false,
          iamRoles: [role],
        };
      }
      this.$ext.log(this.user);
    },
  },
};
</script>

<style lang="scss" scoped>
.options-parent {
  margin: 1rem;
  padding: 2rem 2rem;
  padding-top: 0rem;
  margin-top: 0rem;
  text-align: center;
}
.options-group {
  text-align: left;
  display: inline-block;
  padding: 1rem 1rem;
  vertical-align: top;
  width: 400px;
}
.option-label, .option-value {
  margin-left: 20px;
  font-size: 1rem;
}
.option-label {
  margin-bottom: 10px;
}
.option-value {
  margin-bottom: 25px;
}
.menu-button,
.user-button {
  font-size: '12px';
  height: 30px;
}
.user-button {
  width: 175px;
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
  display: inline-block;
  margin: 0px;
  margin-top: 20px;
  margin-left: 40px;
  padding: 0px;
  padding-bottom: 3px;
  border: none;
  min-width: 500px;
}
.toolbar-field {
  height: 30px;
  margin-right: 5px;
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

.json {
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
#searchBox {
  padding: 10px !important;
  padding-left: 2.5rem !important;
}

</style>
