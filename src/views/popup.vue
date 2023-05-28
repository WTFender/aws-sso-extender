<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<!-- eslint-disable prefer-destructuring -->
<!-- eslint-disable max-len -->
<!-- eslint-disable vue/v-on-event-hyphenation -->
<template>
  <!--- Header 
  todo Export and import user config
  todo chicklet IAM roles, removeable
  -->
  <PToolbar style="margin: 0px; padding: 7px">
    <template #start>
      <!---
      <i
        class="pi menu-icon p-toolbar-separator"
        :class="{
          'page-active': page === 'users',
          'pi-users': users.length > 1,
          'pi-user': users.length >= 1,
          }"
          @click="setPage('users')"
        />
        --->
      <PrimeButton
        :disabled="!permissions.sso || !loaded"
        :text="page !== 'users'"
        @click="page = 'users'"
        class="truncate"
        icon="pi pi-user"
        style="margin: 0px"
        severity="primary"
        :label="user.subject"
      />
    </template>
    <template #center v-if="permissions.sso && loaded">
      <div v-if="page === 'users'">
        <div class="py-2">
          <PrimeButton
            v-for="tab in tabs"
            style="padding: 5px; margin: 0px"
            @click="activeTab = tab.index"
            :text="activeTab !== tab.index"
            size="small"
            :label="tab.label"
          />
        </div>
      </div>
      <span v-else class="p-input-icon-left" style="margin: 0px">
        <i class="pi pi-search" />
        <InputText
          id="searchBox"
          ref="searchBox"
          v-model="filterProfiles['global'].value"
          placeholder="Search Profiles"
        />
      </span>
    </template>
    <template #center v-else><h3>AWS SSO Extender - Setup</h3></template>
    <template #end>
      <PSelectButton
        :disabled="!permissions.sso || !loaded"
        style="margin: 0px"
        v-model="profileTable"
        :options="items"
        aria-labelledby="basic"
        optionLabel="value"
        dataKey="value"
      >
        <template #option="slotProps">
          <i :class="slotProps.option.icon"></i>
        </template>
      </PSelectButton>
    </template>
  </PToolbar>

  <div class="card">
    <!--- Setup -->
    <SetupSteps
      v-show="!permissions.sso || !loaded"
      style="margin-top: 10px"
      :permissions="permissions"
      :loaded="loaded"
      @demo="demo()"
    />

    <ProfileTable
      v-show="page === 'favorites' || page === 'profiles'"
      :demoMode="demoMode"
      :settings="settings"
      :filterProfiles="filterProfiles"
      :app-profiles="page === 'favorites' ? faveProfiles : userProfiles"
      :user="user"
      @updateProfile="updateProfile"
      @updateProfileLabel="updateProfileLabel"
    />

    <!--- User page -->
    <PScrollPanel
      v-show="page === 'users'"
      class="scroll"
      style="max-width: 100%; height: 500px"
    >
      <div v-if="activeTab === 0" class="settings">
        <h3>Switch User</h3>
        <PListbox
          v-model="user"
          name="userSelect"
          :options="users"
          class="w-full md:w-14rem"
          style="margin-bottom: 5px"
        >
          <template #option="slotProps">
            <div class="flex align-items-center">
              <div>
                {{
                  slotProps.option.subject +
                  " @ " +
                  slotProps.option.managedActiveDirectoryId
                }}
              </div>
            </div>
          </template>
        </PListbox>
        <h3>Default User</h3>
        <select
          id="defaultUserSelect"
          name="defaultUserSelect"
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
        <h3>User Config</h3>
        <PrimeButton
          icon="pi pi-download"
          class="p-button-primary"
          label="Export"
          style="margin-right: 5px"
          @click="exportUser()"
        />
        <PrimeButton
          icon="pi pi-pencil"
          class="p-button-secondary"
          label="Edit"
          style="margin-right: 5px"
          @click="importUser = true"
        />
        <PDialog
          v-model:visible="importUser"
          header="Edit User Config"
          :style="{ width: '500px' }"
        >
        
          <PScrollPanel class="scroll" style="max-width: 100%; max-height: 300px">
            <p>Edit at your own risk. Settings in users[].custom persist while most other settings are overwritten during SSO login.</p>
            <pre ref="configJson" style="font-size: 0.8rem" contenteditable="true">{{
              dataJson
            }}</pre>
          </PScrollPanel>
          <template #footer>
            <PrimeButton label="Save" icon="pi pi-save" @click="importUserConfig()" autofocus />
            <p ref="configError" style="color: red; display: none;" >Unable to save config JSON.</p>
            
          </template>
        </PDialog>
        <PrimeButton
          icon="pi pi-trash"
          class="p-button-danger reset-button"
          label="Reset"
          style="margin-right: 5px"
          @click="resetCustom()"
        />
      </div>
      <div v-if="activeTab === 1" class="settings">
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
          <form>
            <h3>Customize the AWS Console</h3>
            <div>
              <div v-if="$ext.platform === 'firefox'">
                <PCheckbox
                  @click="toggleContainers()"
                  v-model="settings.firefoxContainers"
                  inputId="container"
                  name="container"
                  :binary="true"
                  style="margin-right: 10px; text-align: middle"
                />
                <label for="container">Open in Firefox Containers</label><br /><br />
              </div>
              <label id="sso-label">SSO session Label</label>
              <br />
              <InputText
                aria-describedby="sso-label"
                id="sessionLabelSso"
                v-model="user.custom.sessionLabelSso"
                name="sessionLabelSso"
                class="p-inputtext-sm"
                style="width: 350px; margin-right: 10px"
                :placeholder="user.custom.sessionLabelSso"
              />
            </div>
            <br />
            <div>
              <label id="iam-label">IAM session Label</label>
              <br />
              <InputText
                aria-describedby="iam-label"
                id="sessionLabelIam"
                v-model="user.custom.sessionLabelIam"
                name="sessionLabelIam"
                class="p-inputtext-sm"
                style="width: 350px; margin-right: 10px"
                :placeholder="user.custom.sessionLabelIam"
              />
            </div>
            <details>
              <summary>Use variables in your labels</summary>
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
                inputId="labelHeader"
                name="labelHeader"
                :binary="true"
                style="margin-right: 10px"
              />
              <label for="labelHeader">Label header</label><br />
              <PCheckbox
                v-model="user.custom.labelFooter"
                inputId="labelFooter"
                name="labelFooter"
                :binary="true"
                style="margin-right: 10px"
              />
              <label for="labelFooter" class="ml-2">Label footer</label>
            </div>
            <div>
              <PCheckbox
                v-model="user.custom.colorHeader"
                inputId="colorHeader"
                name="colorHeader"
                :binary="true"
                style="margin-right: 10px"
              />
              <label for="colorHeader" class="ml-2">Colorize header</label><br />
              <PCheckbox
                v-model="user.custom.colorFooter"
                inputId="colorFooter"
                name="colorFooter"
                :binary="true"
                style="margin-right: 10px"
              />
              <label for="colorFooter" class="ml-2">Colorize footer</label>
            </div>
            <br />
            <div style="margin-bottom: 10px">
              <ColorPicker
                inputId="colorDefault"
                name="colorDefault"
                @click.prevent="colorPickerVisible = !colorPickerVisible"
                v-model="user.custom.colorDefault"
                id="colorDefault"
              />
              <label for="colorDefault" class="ml-2"> Default AWS Console color</label>
            </div>
            <!---
                  Colorpicker, dropdowns, and certain other elements won't stay open on firefox
                  Workaround is to render our own dialog box on firefox with the elements
                -->
            <PDialog
              v-if="$ext.platform === 'firefox'"
              v-model:visible="colorPickerVisible"
              :style="{ width: '50vw' }"
            >
              <ColorPicker
                v-if="colorPickerVisible"
                :inline="true"
                v-model="user.custom.colorDefault"
              /> </PDialog
            ><br />
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
      <div v-if="activeTab === 2" class="settings">
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
          @addIamRole="addIamRole"
          @updateProfile="updateProfile"
          @setPage="setPage"
          @saveUser="saveUser"
        />
      </div>
    </PScrollPanel>

    <!--- Settings page -->
    <div v-show="page === 'settings'" class="settings">
      <div>
        <PrimeButton
          class="p-button-danger reset-button"
          label="Reset All Data"
          @click="reset()"
        />
      </div>
      <br />
    </div>
  </div>
  <!--- Footer -->
  <div class="footer" />
</template>
<script lang="ts">
import { saveAs } from "file-saver";
import { waitForElement } from "../utils";
import { FilterMatchMode } from "primevue/api";
import demoData from "../demo";
import {
  AppData,
  CustomData,
  ExtensionData,
  ExtensionSettings,
  IamRole,
  UserData,
} from "../types";
import Menu from "primevue/menu";

export default {
  name: "PopupView",
  data() {
    return {
      importUser: false,
      profileTable: { icon: "pi pi-list", value: "profiles" },
      tabs: [
        { index: 0, label: "Users" },
        { index: 1, label: "Console" },
        { index: 2, label: "Roles" },
      ],
      activeTab: 0,
      filterProfiles: {},
      items: [
        { icon: "pi pi-list", value: "profiles" },
        { icon: "pi pi-star", value: "favorites" },
      ],
      raw: {} as ExtensionData,
      defaultUser: "",
      colorPickerVisible: false,
      demoMode: false,
      permissions: {
        history: false,
        console: false,
        signin: false,
        sso: false,
        containers: false,
      },
      setupSteps: [
        { id: "permissions", title: "Required Permissions", ref: this.permissions },
        { id: "login", title: "Login to AWS SSO", ref: this.loaded },
      ],
      loaded: false,
      user: {
        custom: {},
      } as UserData,
      users: [] as UserData[],
      settings: {
        defaultUser: "lastUserId",
        lastUserId: "",
        lastProfileId: "",
        firefoxContainers: false,
      } as ExtensionSettings,
      appProfiles: [] as AppData[],
      dataJson: "",
      staleHours: 1,
      status: {
        message: "",
        status: "unknown",
      },
      lastPage: "profiles",
      page: "", // profiles, favorites, users
      updatedAt: 0,
    };
  },
  computed: {
    userConfigUpdate() {
      let update = false;
      if (this.dataJson !== (this.$refs.userConfigJson as any).innerText) {
        update = true;
      }
      this.$ext.log(`popup:userConfigUpdate:${update}`)
      return update;
    },
    consolePermissions() {
      if (this.$ext.platform === "firefox") {
        return this.permissions.console && this.permissions.containers;
      } else {
        return this.permissions.console;
      }
    },
    defaultUserOptions() {
      let options = [{ userId: "lastUserId", label: "Last sign-in activity" }];
      options = options.concat(this.userOptions);
      return options;
    },
    userOptions() {
      const options = this.users.map((user: UserData) => ({
        ...user,
        label: `${user.subject} @ ${user.managedActiveDirectoryId}`,
      }));
      return options;
    },
    staleData() {
      const limit = this.staleHours * 1000 * 60 * 60;
      if (Date.now() - limit > this.updatedAt) {
        return true;
      }
      return false;
    },
    faveProfiles(): AppData[] {
      return this.userProfiles.filter(
        (ap: AppData) => ap.profile.custom?.favorite === true
      );
    },
    userProfiles() {
      this.$ext.log(this.user);
      if (this.user === null) {
        return [];
      }
      // eslint-disable-next-line vue/max-len
      return this.appProfiles.filter((ap: AppData) =>
        this.user.appProfileIds.includes(ap.profile.id)
      );
    },
  },
  watch: {
    profileTable: {
      handler(v) {
        if (v.value === "profiles" || v.value === "favorites") {
          this.setPage(v.value);
        }
      },
    },
    page: {
      handler(v) {
        this.lastPage = v;
        if (v === "users") {
          // clear profile table selection
          this.profileTable = { icon: '', value: '' };
        }
        if (v === "profiles" || v === "favorites") {
          waitForElement("#searchBox").then((searchBox) => {
            searchBox.focus();
          });
        }
      },
    },
    "settings.firefoxContainers": {
      handler: function (v) {
        if (v === true) {
          this.$ext.config.browser.runtime.sendMessage({
            action: "enableFirefoxContainers",
          });
        } else if (v === false) {
          this.$ext.config.browser.runtime.sendMessage({
            action: "disableFirefoxContainers",
          });
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
      if (v === true) {
        if (this.faveProfiles.length >= 1) {
          this.setPage("favorites");
          this.profileTable = { icon: "pi pi-star", value: "favorites" };
        } else {
          this.setPage("profiles");
          this.profileTable = { icon: "pi pi-list", value: "profiles" };
        }
      }
    },
  },
  created() {
    this.filterProfiles = {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    };
    this.$ext.config.browser.permissions.onAdded.addListener(this.handlePermissions);
    // eslint-disable-next-line func-names
    this.$ext.checkPermissions().then((perms) => {
      this.permissions = perms;
    });
    this.reload();
  },
  methods: {
    importUserConfig() {
      const configJson = (this.$refs.configJson as any).innerText
      if (this.$ext.importUserConfig(configJson)) {
        this.importUser = false;
        this.reload();
      } else {
        (this.$refs.configError as any).style.display = "block";
      }
    },
    exportUser() {
      var fileToSave = new Blob([this.dataJson], {
        type: "application/json",
      });
      saveAs(fileToSave, `${this.user.subject}-${this.$ext.config.name}.json`);
    },
    toggle(event) {
      const menu = (this.$refs.menu as any) as Menu;
      menu.toggle(event);
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
          "activeTab",
          "tabs",
          "webRequest",
          "webRequestBlocking",
          "webRequestFilterResponse",
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
      if (this.$ext.platform === "firefox") {
        this.$ext.log("popup:requestPermissionsContainers");
        this.requestPermissionsContainers();
      } else {
        this.$ext.log("popup:requestPermissionsConsole");
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
      this.$ext.log("popup:demoMode");
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
    getUser(userId: string) {
      const user = this.users.filter((u) => u.userId === userId)[0];
      return user;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        if (this.user.userId !== "demoUserId1") {
          this.user = demoData.users[0];
        }
      } else {
        this.$ext
          .loadData()
          .then((data) => {
            this.load(data);
          })
          .catch((error) => {
            this.status = { status: "unhealthy", message: "failed to load data" };
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
      this.$ext.log(`popup:page:${page}`);
      this.page = page;
    },
    reset() {
      this.appProfiles = [];
      this.$ext.resetData();
      this.$ext.resetPermissions();
      window.close();
    },
    resetCustom() {
      this.user.custom = this.$ext.defaultCustom;
      this.$ext.saveUser(this.user).then(() => {
        window.close();
      });
    },
    updateProfile(appProfile: AppData) {
      this.$ext.log("popup:updateProfile");
      this.user.custom.profiles[appProfile.profile.id] = appProfile.profile
        .custom as CustomData;
      this.$ext.log(this.user);
      if (this.faveProfiles.length === 0) {
        this.setPage("profiles");
      }
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
      if (!this.demoMode && this.user.userId !== "demoUserId1") {
        this.$ext.saveUser(this.user).then(() => {
          this.reload();
        });
      }
    },
    updateProfileLabel(event) {
      let { newData } = event;
      if ("profile.custom.label" in newData) {
        newData.profile.custom.label = newData["profile.custom.label"];
      }
      if ("profile.custom.color" in newData) {
        newData.profile.custom.color = newData["profile.custom.color"];
      }
      this.updateProfile(newData);
    },
    addIamRole(role: IamRole) {
      this.$ext.log("popup:addIamRole");
      if (role.profileId in this.user.custom.profiles) {
        this.user.custom.profiles[role.profileId].iamRoles.push(role);
      } else {
        this.user.custom.profiles[role.profileId] = {
          color: "",
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
.truncate {
  width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  width: 580px !important;
  min-height: 500px;
  display: inline-block;
  margin: 0px;
  padding: 0px;
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

.footer {
  color: #343a40;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  position: fixed;
  bottom: 0px;
  height: 5px;
  left: 0px;
  right: 0px;
  overflow: hidden;
  text-align: center;
}

.json,
.settings {
  margin: 15px;
}
</style>
