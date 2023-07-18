<!-- eslint-disable max-len -->
<template>
  <DataTable
    v-model:filters="filterProfilesComputed"
    v-model:selection="selectedProfile"
    selection-mode="single"
    class="p-datatable-sm"
    scroll-height="500px"
    :value="appProfiles"
    row-group-mode="rowspan"
    sortMode="multiple"
    responsive-layout="scroll"
    @rowReorder="setProfiles"
    @keydown.enter="navSelectedProfile()"
  >
    <!--- profile editor popup --->
    <PDialog
      v-model:visible="editorVisible"
      header="Edit Profile"
      :style="{ width: '500px' }"
    >
      <PScrollPanel class="scroll" style="max-width: 100%; max-height: 300px">
        <form style="margin-left: 10px">
          <div style="margin-bottom: 10px">
            <small id="profile-label-help">Profile Name</small>
            <InputText
              v-model="activeProfile.profile.name"
              class="p-inputtext-sm"
              aria-describedby="profile-label-help"
              style="width: 400px"
              :disabled="true"
            />
          </div>
          <small id="label-help">
            {{
              activeProfile.applicationName === "AWS Account"
                ? "Profile Label & Color"
                : "Profile Label"
            }}
          </small>
          <div style="margin-bottom: 10px">
            <InputText
              id="profileLabel"
              v-model="activeProfile.profile.custom!.label"
              class="p-inputtext-sm"
              style="width: 250px; margin-right: 10px"
              aria-describedby="label-help"
              :placeholder="activeProfile.profile.name"
            />
            <ColorPicker
              v-if="activeProfile.applicationName === 'AWS Account'"
              @click="colorPickerVisible = !colorPickerVisible"
              v-model="activeProfile.profile.custom!.color"
            />
            <InputText v-if="activeProfile.applicationName === 'AWS Account'"
              v-model="activeProfile.profile.custom!.color" class="p-inputtext-sm"
              style="width: 100px; margin-left: 10px"
            />
            <!--- Colorpicker popup doesn't work, create our own --->
            <PDialog
              v-if="$ext.platform === 'firefox' || $ext.platform === 'safari'"
              v-model:visible="colorPickerVisible"
              :style="{ width: '50vw' }"
            >
              <ColorPicker v-if="colorPickerVisible" :inline="true" v-model="activeProfile.profile.custom!.color" />
            </PDialog>
          </div>
          <div
            v-if="activeProfile.applicationName === 'AWS Account' && (!permissions.console || !permissions.signin)"
            style="text-align: center; padding-top: 20px;"
          >
            <PrimeButton size="small" icon="pi pi-lock" class="p-button-success" label="Request Permissions"
              style="margin-top: 5px" @click="requestPermissions()" />
            <p style="margin-top: 10px;">
              In order to customize the AWS console and assume IAM roles, this extension requires additional permissions.
            </p>
          </div>
          <div v-else-if="activeProfile.applicationName === 'AWS Account'">
            <div style="margin-bottom: 10px">
              <small id="account-label-help">AWS Account ID</small>
              <InputText
                v-model="activeProfile.searchMetadata!.AccountId"
                class="p-inputtext-sm"
                aria-describedby="account-label-help"
                style="width: 400px"
                :disabled="true"
              />
            </div>
            <div style="margin-bottom: 10px">
              <small id="account-name-label-help">AWS Account Name</small>
              <InputText
                v-model="activeProfile.searchMetadata!.AccountName"
                class="p-inputtext-sm"
                aria-describedby="account-name-label-help"
                style="width: 400px"
                :disabled="true"
              />
            </div>
            <div
              style="margin-bottom: 10px"
            >
              <small id="profile-label-help">AWS Console Preview</small>
              <InputText
                id="consolePreview"
                v-model="consolePreview"
                class="p-inputtext-sm"
                aria-describedby="profile-label-help"
                style="width: 400px"
                :disabled="true"
                :style="consoleStyle"
              />
            </div>
          </div>
          <div>
            <h3 v-if="activeProfile.profile.custom!.iamRoles.length > 0">IAM Roles</h3>
            <PBadge
              v-for="(role, idx) in activeProfile.profile.custom!.iamRoles"
              :key="idx"
              :value="role.label || role.roleName"
              class="role-link remove-role-link"
              :style="{ margin: '5px', 'background-color': `#${role.color}` }"
              icon="pi pi-times"
            >
              {{ role.label || role.roleName }}
              <i
                class="pi pi-times"
                style="font-size: 0.5rem"
                @click="removeIamRole(role, activeProfile)"
              />
            </PBadge>
          </div>
        </form>
      </PScrollPanel>
      <template #footer>
        <PrimeButton label="Save" icon="pi pi-save" @click="saveActiveProfile()" />
        <p ref="profileError" style="color: red; display: none">
          Unable to save Profile.
        </p>
      </template>
    </PDialog>
    <PColumn rowReorder headerStyle="width: 3rem" :reorderableColumn="false" />
    <PColumn
      sortable
      header="Application"
      field="name"
      body-style="text-align: center;"
      :style="{ 'min-width': '120px' }"
    >
      <template #body="slotProps">
        <div>
          <img
            :alt="slotProps.data.profile.name"
            :src="slotProps.data.icon"
            width="96"
            style="vertical-align: middle"
          />
          <br />
          <span v-if="slotProps.data.applicationName !== 'AWS Account'">{{
            slotProps.data.name
          }}</span>
          <div v-else>
            <span>{{ slotProps.data.searchMetadata.AccountName }}</span
            ><br />
            <span style="font-size: 0.8rem">{{
              slotProps.data.searchMetadata.AccountId
            }}</span>
          </div>
        </div>
      </template>
    </PColumn>

    <!--- profile & iam role links --->
    <PColumn
      sortable
      header="Profile"
      :style="{ 'min-width': '220px' }"
      field="profile.name"
    >
      <template #body="slotProps">
        <div>
          <a
            class="sso-link"
            target="_blank"
            rel="noopener noreferrer"
            :href="demoMode ? 'about:blank' : $ext.createProfileUrl(user, slotProps.data)"
          >
            <i
              class="pi pi-external-link"
              :style="{ color: `#${slotProps.data.profile.custom.color}` }"
            />
            {{ slotProps.data.profile.custom.label || slotProps.data.profile.name }}</a
          >
        </div>
        <div v-if="'iamRoles' in slotProps.data.profile.custom">
          <PBadge
            v-for="(role, idx) in slotProps.data.profile.custom.iamRoles"
            :key="idx"
            :value="role.label || role.roleName"
            class="role-link"
            :style="{ margin: '5px', 'background-color': `#${role.color}` }"
            @click="assumeIamRole(role, slotProps.data)"
          />
        </div>
      </template>
    </PColumn>

    <!--- edit profile --->
    <PColumn :style="{ width: '20px' }">
      <template #body="slotProps">
        <i class="pi pi-pencil" @click="editProfile(slotProps.data)" />
      </template>
    </PColumn>

    <!--- favorite --->
    <PColumn :style="{ width: '20px' }">
      <template #body="slotProps">
        <i
          class="pi"
          :class="{
            'pi-star-fill': slotProps.data.profile.custom.favorite,
            'pi-star': !slotProps.data.profile.custom.favorite,
          }"
          @click="fave(slotProps.data)"
        />
      </template>
    </PColumn>

    <!--- inclusive search fields --->
    <PColumn
      v-for="field in searchableFields"
      :field="field"
      style="display: none"
      header-style="display: none;"
    />

    <!--- spacing for scrollbar --->
    <PColumn :style="{ width: '10px' }" />
  </DataTable>
</template>

<script lang="ts">
import { AppData, ExtensionSettings, IamRole, UserData } from "../types";
import { getFontColor, waitForElement } from "../utils";

export default {
  name: "ProfileTable",
  props: {
    activeProfile: {
      // suppress ts errors, unsure why this is required
      required: false,
      default: () => ({} as AppData),
    },
    permissions: {
      type: Object,
      required: true,
    },
    filterProfiles: {
      type: Object,
      required: true,
    },
    user: {
      required: true,
      type: Object,
      default: () => ({} as UserData),
    },
    appProfiles: {
      type: Array,
      required: true,
    },
    settings: {
      required: true,
      type: Object,
      default: () => ({} as ExtensionSettings),
    },
    demoMode: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ["updateProfile", "requestPermissions"],
  computed : {
    consoleStyle() {
      return {
        'background-color': `#${this.activeProfile.profile.custom!.color}`,
        'color': getFontColor(this.activeProfile.profile.custom!.color)
      }
    },
    consolePreview() {
      return this.$ext.buildLabel(
        this.user.custom.sessionLabelSso,
        this.user.subject,
        this.activeProfile.profile.custom!.label || this.activeProfile.profile.name,
        null,
        this.activeProfile.searchMetadata!.AccountId,
        this.activeProfile.searchMetadata!.AccountName,
      );
    },
    filterProfilesComputed() {
      return this.filterProfiles;
    },
  },
  data() {
    return {
      activeProfile: {} as AppData,
      colorPickerVisible: false,
      editorVisible: false,
      searchableFields: [
        'id',
        'applicationId',
        'description',
        'profile.custom.label',
        'profile.id',
        'profile.description',
        'profile.protocol',
      ],
      selectedProfile: null,
      sourceProfile: {} as AppData,
    };
  },
  methods: {
    requestPermissions(){
      this.$emit("requestPermissions");
    },
    editProfile(profile){
      // duplicate profile without references
      this.activeProfile = JSON.parse(JSON.stringify(profile));
      this.sourceProfile = JSON.parse(JSON.stringify(profile));
      this.editorVisible = true;
      waitForElement("#profileLabel").then((profileLabel) => {
        profileLabel.focus();
      });
    },
    saveActiveProfile(){
      this.activeProfile.profile.custom!.color = this.activeProfile.profile.custom!.color.replace('#', '');
      this.$emit("updateProfile", this.activeProfile);
      this.editorVisible = false;
    },
    removeIamRole(iamRole: IamRole, appProfile: AppData) {
      this.$ext.log("removeIamRole");
      let iamRoles: IamRole[] = [];
      appProfile.profile.custom!.iamRoles.forEach((role) => {
        if (role.roleName !== iamRole.roleName
          || role.accountId !== iamRole.accountId
          || role.profileId !== iamRole.profileId) {
          iamRoles.push(role);
        }
      });
      appProfile.profile.custom!.iamRoles = iamRoles;
      this.$emit("updateProfile", appProfile);
    },
    setProfiles(profiles) {
      this.$ext.log("setProfiles");
      profiles.forEach(profile => {

      });
      this.$ext.log(profiles);
    },
    assumeIamRole(iamRole, appProfile) {
      // TODO notify on silent failure switching role
      this.$ext.log("assumeIamRole");
      this.$ext.log(iamRole);
      if (this.demoMode) {
        window.open("about:blank", "_blank");
        return;
      }
      const settings = this.settings;
      settings.lastProfileId = appProfile.profile.id;
      this.$ext.saveSettings(settings).then(() => {
        this.$ext.queueIamLogin(iamRole, appProfile).then(() => {
          const profileUrl = this.$ext.createProfileUrl(this.user, appProfile);
          window.open(profileUrl, "_blank");
        });
      });
    },
    navSelectedProfile() {
      const profileUrl = this.$ext.createProfileUrl(this.user, this.selectedProfile);
      window.open(profileUrl, "_blank");
    },
    encodeUriPlusParens(str) {
      return encodeURIComponent(str).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16)}`
      );
    },
    fave(appProfile) {
      // TODO fix favorite issue for multi users
      appProfile.profile.custom.favorite = !appProfile.profile.custom.favorite;
      this.$emit("updateProfile", appProfile);
    },
  },
};
</script>

<style lang="scss" scoped>
.sso-link {
  color: #495057;
  text-decoration: none;
  text-overflow: ellipsis;
  border-radius: 4pt;
}

.sso-link:hover {
  color: #5e3add;
  cursor: pointer;
}

.role-link {
  white-space: nowrap;
  margin-right: 5px;
}

.role-link:hover {
  background-color: #5e3add !important;
  cursor: pointer;
}

.remove-role-link:hover {
  background-color: red !important;
  cursor: pointer;
}

.pi-star:hover {
  color: gold !important;
  cursor: pointer;
}

.pi-star-fill {
  color: gold !important;
}

.pi-star-fill:hover {
  color: grey !important;
  cursor: pointer;
}

.p-inputtext {
  padding: 5px !important;
}

#consolePreview {
  opacity: 1 !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>
