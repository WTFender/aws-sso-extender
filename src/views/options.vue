<!-- eslint-disable vue/max-len -->
<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <PToolbar style="height: 45px; margin: 0px; display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap;">
    <template #start>
      <PrimeButton
        text
        class="toolbar-item user-button"
        :label="user.custom.displayName || user.subject"
        icon="pi pi-cog"
        size="small"
        :style="{ width: users.length > 1 ? '160px' : '200px' }"
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
    <template #end>
      <PrimeButton
        raised
        icon="pi pi-download"
        class="p-button-primary"
        label="Export"
        style="margin-right: 1rem; font-size: 12px; height: 30px;"
        size="small"
        @click="exportUser()"
      />
      <PrimeButton
        raised
        icon="pi pi-trash"
        class="p-button-danger reset-button"
        label="Reset"
        style="margin-right: 1rem; font-size: 12px; height: 30px;"
        size="small"
        @click="reset()"
      />
      <PrimeButton
        raised
        icon="pi pi-code"
        :label="viewJson ? 'Settings' : 'JSON'"
        style="margin-right: 1rem; font-size: 12px; height: 30px;"
        severity="secondary"
        size="small"
        @click="viewJson = !viewJson"
      />
    </template>
  </PToolbar>

  <div
    v-if="viewJson"
    class="options-parent"
    style="height: 768px; display: flex; justify-content: center;"
  >
    <json-editor-vue
      ref="configJson"
      v-model="jsonEditor"
      style="width: 100%; max-width: 768px; height: 768px;"
      :current-mode="'tree'"
      :mode-list="['tree', 'text', 'view']"
      @change="importUserConfig()"
    />
  </div>

  <div
    v-else
    class="options-parent"
  >
    <div class="options-group">
      <h2>Extension Settings</h2>
      <small class="option-label">Display Name</small><br>
      <InputText
        id="displayName"
        v-model="user.custom.displayName"
        name="displayName"
        class="option-value"
        style="width: 330px;"
        :placeholder="user.subject"
        @change="saveUser()"
      />
      <small class="option-label">Default User</small><br>
      <select
        id="defaultUserSelect"
        name="defaultUserSelect"
        class="option-value"
        style="margin-bottom: 1.5rem; width: 330px; padding: 1rem; border-radius: 5px;"
        @change="setDefaultUser($event)"
      >
        <option
          v-for="u in defaultUserOptions"
          :key="u.userId"
          :label="u.label"
          :value="u.userId"
          :selected="u.userId === settings.defaultUser"
        />
      </select><br>
      <small
        v-tooltip.bottom="$ext.platform === 'firefox' ? 'Customize key binds @ about:addons' : 'Customize key binds @ chrome://extensions/shortcuts'"
        class="option-label"
        style="margin-top: 1.5rem;"
      >Profile Hotkeys</small><br>
      <p style="margin-left: 1rem; font-size: .75rem;">
        Change keybinds in your browser settings
      </p>
      <div
        class="option-label"
        style="margin-top: .5rem; margin-left: 1rem;"
      >
        <form>
          <div
            v-for="hotkey in profileHotkeys"
            :key="hotkey['name']"
          >
            <code>{{ hotkey['shortcut'] }}</code><select
              style="margin-bottom: 10px; width: 330px; padding: .1rem; border-radius: 5px;"
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
            <br>
          </div>
        </form>
      </div>
      <form
        class="option-label"
        style="margin-top: 1rem;"
      >
        <div
          v-for="setting in settingOptions"
          :key="setting.id"
        >
          <PCheckbox
            v-model="settings[setting.id]"
            :input-id="setting.id"
            :name="setting.id"
            :binary="true"
            style="margin-left: 1rem; margin-right: 10px; margin-top: 5px; margin-bottom: 5px; vertical-align: middle;"
          />
          <label
            v-tooltip.bottom="setting.tooltip"
            :for="setting.id"
          >{{ setting.label }}</label>
        </div>
        <div
          name="iconColor"
          class="p-checkbox p-component p-checkbox-disabled"
          style="margin-left: 1rem; margin-right: 10px; margin-top: 5px; margin-bottom: 5px; vertical-align: middle;"
        >
          <div class="p-hidden-accessible">
            <input
              type="checkbox"
              disabled
            >
          </div><div
            class="p-checkbox-box p-disabled"
            :style="{ 'background-color': iconColorOptions[settings.iconColor] }"
          >
            <span class="p-checkbox-icon" />
          </div>
        </div>
        <label
          v-tooltip.bottom="'Extension icon color'"
          for="iconColor"
          style="margin-right: 10px;"
        >Icon Color</label>
        <select
          v-model="settings.iconColor"
          style="margin-bottom: 5px;"
          @change="saveUser()"
        >
          <option
            v-for="c in ['red', 'blue', 'green', 'purple']"
            :key="c + 'icon'"
            :label="c"
            :value="c"
          />
        </select>
      </form>
    </div>
    <div class="options-group">
      <div>
        <h2>
          AWS Console Settings
        </h2>
        <div v-if="!consolePermissions">
          <p>This extension requires permissions to customize the AWS console:</p>
          <code>https://*.console.aws.amazon.com/*</code><br>
          <PrimeButton
            raised
            size="small"
            icon="pi pi-lock"
            class="p-button-success"
            label="Request Permissions"
            style="margin-top: 10px"
            @click="requestPermissionsConsole()"
          />
        </div>
        <div v-else>
          <form>
            <div>
              <small
                id="sso-label"
                class="option-label"
              >SSO Console Label</small>
              <br>
              <InputText
                id="sessionLabelSso"
                v-model="user.custom.sessionLabelSso"
                aria-describedby="sso-label"
                name="sessionLabelSso"
                class="option-value"
                style="width: 330px;"
                :placeholder="user.custom.sessionLabelSso"
                @change="saveUser()"
              />
            </div>
            <div>
              <small
                id="iam-label"
                class="option-label"
              >IAM Console Label</small>
              <br>
              <InputText
                id="sessionLabelIam"
                v-model="user.custom.sessionLabelIam"
                aria-describedby="iam-label"
                name="sessionLabelIam"
                class="option-value"
                style="width: 330px; margin-right: 10px; margin-bottom: 5px;"
                :placeholder="user.custom.sessionLabelIam"
                @change="saveUser()"
              />
            </div>
            <div
              class="option-label"
              style="margin-left: 1rem;"
            >
              <p style="font-size: .75rem; margin-bottom: .5rem;">
                Label variables
              </p>
              <code>{{ "\{\{user\}\}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SSO user" }} </code><br>
              <code>{{ "\{\{role\}\}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IAM role" }} </code><br>
              <code>{{ "\{\{profile\}\}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SSO profile" }} </code><br>
              <code>{{ "\{\{account\}\}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AWS account ID" }} </code><br>
              <code>{{ "\{\{accountName\}\} AWS account alias" }} </code><br>
            </div>
            <br>
            <div
              class="option-value"
              style="width: 40%; float: left;"
            >
              <PCheckbox
                v-model="user.custom.labelHeader"
                v-tooltip.bottom="'Apply custom settings to the header of the AWS console'"
                input-id="labelHeader"
                name="labelHeader"
                :binary="true"
                class="setting-checkbox"
                @change="saveUser()"
              />
              <label
                for="labelHeader"
                class="setting-label"
              >Label header</label>
              <PCheckbox
                v-model="user.custom.labelFooter"
                v-tooltip.bottom="'Apply custom settings to the footer of the AWS console'"
                input-id="labelFooter"
                name="labelFooter"
                :binary="true"
                class="setting-checkbox"
                @change="saveUser()"
              />
              <label
                for="labelFooter"
                class="setting-label"
              >Label footer</label>
              <PCheckbox
                v-model="user.custom.labelIcon"
                v-tooltip.bottom="'Include profile icon in the AWS console label'"
                input-id="labelIcon"
                name="labelIcon"
                :binary="true"
                class="setting-checkbox"
                @change="saveUser()"
              />
              <label
                for="labelIcon"
                class="setting-label"
              >Profile icon</label>
            </div>
            <div class="option-value">
              <PCheckbox
                v-model="user.custom.colorHeader"
                v-tooltip.bottom="'Colorize the header of the AWS console'"
                input-id="colorHeader"
                name="colorHeader"
                :binary="true"
                class="setting-checkbox"
                @change="saveUser()"
              />
              <label
                for="colorHeader"
                class="setting-label"
              >Colorize header</label>
              <PCheckbox
                v-model="user.custom.colorFooter"
                v-tooltip.bottom="'Colorize the footer of the AWS console'"
                input-id="colorFooter"
                name="colorFooter"
                :binary="true"
                class="setting-checkbox"
                @change="saveUser()"
              />
              <label
                for="colorFooter"
                class="setting-label"
              >Colorize footer</label>
              <ColorPicker
                id="colorDefault"
                v-model="user.custom.colorDefault"
                v-tooltip.bottom="'Default color of the AWS console header & footer'"
                input-id="colorDefault"
                name="colorDefault"
                @click.prevent="colorPickerVisible = !colorPickerVisible"
                @change="saveUser()"
              />
              <label for="colorDefault"> Default color</label>
            </div>
            <!---
                  Colorpicker, dropdowns, and certain other elements won't stay open on firefox
                  Workaround is to render our own dialog box on firefox with the elements
                -->
            <PCheckbox
              v-if="$ext.platform === 'firefox'"
              v-model="settings.firefoxContainers"
              v-tooltip.bottom="'Open the AWS Console in Firefox Containers'"
              input-id="container"
              class="option-value setting-checkbox"
              name="container"
              :binary="true"
              style="margin-right: 10px; text-align: middle"
              @click="toggleContainers()"
            />
            <label
              v-if="$ext.platform === 'firefox'"
              for="container"
            >Open in Firefox Containers</label><br>
            <PCheckbox
              v-if="$ext.platform === 'firefox' && settings.firefoxContainers"
              v-model="settings.firefoxResumeContainer"
              v-tooltip.bottom="'Open existing firefox containers; disable to spawn a new container each time.'"
              input-id="resumeContainer"
              class="option-value setting-checkbox"
              name="resumeContainer"
              :binary="true"
              style="margin-right: 10px; text-align: middle"
            />
            <label
              v-if="$ext.platform === 'firefox' && settings.firefoxContainers"
              for="resumeContainer"
            >Resume Firefox Containers</label><br>
            <label
              v-if="$ext.platform === 'firefox' && settings.firefoxContainers"
              for="expireContainer"
              style="margin-left: 3rem;"
            >Remove Firefox Containers</label><br>
            <InputNumber
              v-if="$ext.platform === 'firefox' && settings.firefoxContainers"
              id="expireContainer"
              v-model="settings.firefoxExpireMinsContainer"
              v-tooltip.bottom="'Remove firefox containers after X minutes; set this to your session duration. Set to 0 to disable.'"
              aria-describedby="expireContainer"
              name="expireContainer"
              class="option-value"
              style="width: 60px; height: 1rem; margin-left: 3rem; margin-right: 10px; margin-bottom: 5px;"
              suffix=" mins"
              @change="saveUser()"
            />
            <h3>
              AWS Console Preview
            </h3>
            <select
              v-model="previewProfile"
              :style="consoleStyle"
              style="margin-bottom: .25rem"
            >
              <option
                v-for="p in awsAppProfiles"
                :key="p.profile.id"
                :label="consolePreview(p)"
                :value="p"
                :style="{
                  'background-color': `#${'profile' in p ? p.profile.custom?.color : user.custom.colorDefault}`,
                  color: getFontColor(`#${'profile' in p ? p.profile.custom?.color : user.custom.colorDefault}`),
                }"
              />
            </select><br>
            <select
              v-if="awsIamRoles.length > 0"
              v-model="previewRole"
              :disabled="awsIamRoles.length === 0"
              :style="consoleStyle"
            >
              <option
                v-for="p in awsIamRoles"
                :key="p.profile.id"
                :label="consolePreviewIam(p)"
                :value="p"
                :style="{
                  'background-color': `#${p.profile.custom?.iamRoles[0].color}`,
                  color: getFontColor(`#${p.profile.custom?.iamRoles[0].color}`),
                }"
              />
            </select>
          </form>
        </div>
      </div>
    </div>
    <div class="options-group">
      <div v-if="!permissions.console || !permissions.signin">
        <h2>
          Add IAM Assume Roles
        </h2>
        <p>
          In order to switch IAM roles, this extension requires permissions to the AWS
          console.
        </p>
        <code>https://*.console.aws.amazon.com/*</code><br>
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
    <div
      class="options-group"
    >
      <h2>
        Resources
      </h2>
      <div
        v-for="res in resources"
        :key="res.label"
        class="option-label"
        style="text-align: center;"
      >
        <PrimeButton
          text
          plain
          size="small"
          style="width: 180px; text-align: center; padding: .25rem"
          :icon="'pi ' + res.icon"
          :label="res.label"
          @click="openResource(res.url)"
        />
      </div>
    </div>
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
import { saveAs } from 'file-saver';
import { toast } from 'vue3-toastify';
import { getFontColor } from '../utils';
import demoData from '../demo';
import {
  AppData,
  CustomData,
  ExtensionData,
  ExtensionSettings,
  IamRole,
  UserConfig,
  UserData,
} from '../types';
import 'vue3-toastify/dist/index.css';

export default {
  name: 'OptionsView',
  setup() {
    const notify = (msg, type) => {
      toast(msg, {
        autoClose: 1000,
        type,
        transition: 'zoom',
        position: 'top-center',
        hideProgressBar: true,
      }); // ToastOptions
    };
    return { notify };
  },
  data() {
    return {
      jsonEditor: {},
      switchUser: true,
      previewRole: {} as AppData,
      previewProfile: {} as AppData,
      importTimeoutId: setTimeout(() => {}, 0),
      saveTimeoutId: setTimeout(() => {}, 0),
      viewJson: false,
      iconColorOptions: {
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
          icon: 'pi-info-circle', label: 'Release Notes', url: `https://github.com/WTFender/aws-sso-extender/releases/tag/v${this.$ext.config.browser.runtime.getManifest().version}`,
        },
        {
          icon: 'pi-plus-circle', label: 'Request Feature', url: 'https://github.com/WTFender/aws-sso-extender/issues/new?assignees=&labels=enhancement&projects=&template=FEATURE.yml',
        },
        {
          icon: 'pi-exclamation-triangle', label: 'Report a Bug', url: 'https://github.com/WTFender/aws-sso-extender/issues/new?assignees=&labels=bug&projects=&template=BUG-REPORT.yml',
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
        firefoxResumeContainer: true,
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
      loadedUser: false,
      loadedSettings: false,
    };
  },
  computed: {
    consoleStyle() {
      return {
        'margin-left': '1rem',
        width: '330px',
        padding: '.5rem',
        'border-radius': '5px',
        'background-color': `#${this.user.custom.colorDefault}`,
        color: getFontColor(`#${this.user.custom.colorDefault}`),
      }; 
    },
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
      // sort current user as first option
      const currentUserIdx = options.findIndex(u => u.userId == this.user.userId);
      this.$ext.log(currentUserIdx);
      if (currentUserIdx !== -1) { options.unshift(options.splice(currentUserIdx, 1)[0]) };
      return options;
    },
    awsIamRoles(): AppData[] {
      // eslint-disable-next-line vue/max-len
      const iamRoles = [] as AppData[];
      this.awsAppProfiles.filter((ap) => ap.profile.custom?.iamRoles.length! > 0).forEach((ap) => {
        ap.profile.custom!.iamRoles.forEach((role) => {
          const appProfile = {
            ...ap,
            label: `${role.roleName} - ${ap.searchMetadata!.AccountId} (${ap.searchMetadata!.AccountName}) - ${ap.profile.name}`,
          };
          appProfile.profile.custom!.iamRoles = [role];
          iamRoles.push(appProfile);
        });
      });
      this.$ext.log('iamRoles');
      this.$ext.log(iamRoles);
      return iamRoles;
    },
    awsAppProfiles(): AppData[] {
      const appProfiles = this.userProfiles.filter((ap) => (ap as AppData).applicationName === 'AWS Account') as AppData[];
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
        if (!this.loadedSettings) {
          this.loadedSettings = true;
        } else if (!this.demoMode) {
          this.jsonEditor = {
            user: this.user.custom,
            extension: this.settings,
          } as UserConfig;
          this.saveSettings();
        }
      },
      deep: true,
    },
    user() {
      this.jsonEditor = {
        user: this.user.custom,
        extension: this.raw.settings,
      } as UserConfig;
      if (this.user === null) {
        this.user = this.$ext.getDefaultUser(this.raw);
      } else if (!this.loadedUser) {
        this.loadedUser = true;
      }
      this.refreshProfiles();
      // this.reload();
    },
    'user.custom': {
      handler(newVal, oldVal) {
        delete newVal.updatedAt;
        delete oldVal.updatedAt;
        this.$ext.log('newVal');
        this.$ext.log(newVal);
        this.$ext.log(oldVal);
        if (newVal !== oldVal) {
          this.saveUser();
        }
      },
      deep: true,
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
      this.switchUser = true;
      const options = this.userOptions;
      const currentUserIdx = options.findIndex((u) => u.userId === this.user.userId);
      this.user = options[currentUserIdx + 1] || options[0];
    },
    getFontColor(hex) {
      return getFontColor(hex);
    },
    consolePreview(ap) {
      const label = this.$ext.buildLabel(
        this.user.custom.sessionLabelSso,
        this.user.custom.displayName || this.user.subject,
        ap.profile.custom!.label || ap.profile.name,
        null,
        ap.searchMetadata!.AccountId,
        ap.searchMetadata!.AccountName,
      );
      return `${this.user?.custom.labelIcon && ap?.profile.custom?.icon ? ap?.profile.custom?.icon : ''} ${label}`;
    },
    consolePreviewIam(ap) {
      const label = this.$ext.buildLabel(
        this.user.custom.sessionLabelIam,
        this.user.custom.displayName || this.user.subject,
        ap.profile.custom!.label || ap.profile.name,
        ap.profile.custom.iamRoles[0].label || ap.profile.custom.iamRoles[0].roleName,
        ap.searchMetadata!.AccountId,
        ap.searchMetadata!.AccountName,
      );
      return `${this.user?.custom.labelIcon && ap?.profile.custom?.icon ? ap?.profile.custom?.icon : ''} ${label}`;
    },
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
      clearTimeout(this.importTimeoutId);
      this.importTimeoutId = setTimeout(() => {
        if (this.$ext.importUserConfig(this.user.userId, this.jsonEditor)) {
          this.importUser = false;
          this.reload();
        } else {
          this.notify('Invalid Config JSON', 'error');
        }
      }, 1000);
    },
    exportUser() {
      const fileToSave = new Blob([JSON.stringify({
        user: this.user.custom,
        extension: this.settings,
      },  null, 2)], {
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
    },
    requestPermissionsSwitchrole() {
      this.$ext.config.browser.permissions.request({
        origins: [
          ...this.$ext.config.permissions.console,
          ...this.$ext.config.permissions.signin,
        ],
      });
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
      }
    },
    refreshProfiles() {
      this.appProfiles = [];
      this.appProfiles = this.$ext.customizeProfiles(this.user, this.raw.appProfiles);
      [this.previewProfile] = this.awsAppProfiles;
      [this.previewRole] = this.awsIamRoles;
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
      this.saveUser();
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
          this.user = data.users.filter((u) => u.userId === this.user?.userId)[0];
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
    reset() {
      this.user.custom = this.$ext.defaultCustom;
      this.settings = this.$ext.defaultSettings;
      this.$ext.saveUser(this.user, this.settings.enableSync).then(() => {
        this.$ext.saveSettings(this.settings);
        this.notify('Reset Config', 'success');
      });
      
      // settings saved by watcher
    },
    updateProfile(appProfile: AppData) {
      this.$ext.log('popup:updateProfile');
      this.user.custom.profiles[appProfile.profile.id] = appProfile.profile
        .custom as CustomData;
      this.$ext.log(this.user);
      this.saveUser();
    },
    save() {
      this.$ext.log('popup:save');
      if (this.loaded && !this.demoMode && !this.user.userId.startsWith('demoUser')) {
        clearTimeout(this.saveTimeoutId);
        this.saveTimeoutId = setTimeout(() => {
          this.$ext.saveUser(this.user, this.settings.enableSync).then(() => {
            this.settings.lastUserId = this.user.userId;
            this.$ext.saveSettings(this.settings).then(() => {
              this.notify('Saved Config', 'success');
            });
          });
        }, 2000);
      }
    },
    saveSettings() {
      this.save();
    },
    saveUser() {
      // do not save if user is switching profiles
      this.$ext.log('popup:saveUser');
      this.$ext.log(this.switchUser);
      if (this.switchUser) {
        this.switchUser = false;
      } else {
        this.save()
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
h2, h3, h4, h5, h6, p, small, label, span, select, option, input, button, a {
  font-family: "Segoe UI", Tahoma, sans-serif;
}
.full-screen {
  display: none !important;
}
.options-parent {
  margin: 1rem;
  margin-top: 1rem;
  text-align: center;
}
.options-group {
  margin: 1rem;
  text-align: left;
  display: inline-block;
  padding: 1rem 1rem;
  vertical-align: top;
  width: 400px;
  border-radius: 25px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px;
}
.options-group h2{
  margin-top: 0px;
}
.option-label, .option-value {
  margin-top: .5rem;
  margin-right: 1rem;
  font-size: 1rem;
}
.option-value {
  margin-left: 1rem;
  margin-bottom: 1.5rem;
}
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
  display: inline-block;
  margin: 0px;
  margin-left: 40px;
  padding: 0px;
  padding-bottom: 3px;
  border: none;
  min-width: 500px;
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
  font-size: 1rem;
}

</style>
