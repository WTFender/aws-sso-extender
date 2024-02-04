<!-- eslint-disable max-len -->
<template>
  <h2 style="margin-top: 0px;">Add IAM Assume Roles</h2>
  <div style="margin-left: 20px;">
    <div style="margin-bottom: 10px">
      <small id="arn-help">IAM Role ARN</small><br />
      <InputText
        id="iamRoleArn"
        v-model="newIamRole.arn"
        name="arn"
        class="p-inputtext-sm"
        aria-describedby="arn-help"
        style="width: 100%;"
        placeholder="arn:aws:iam::123412341234:role/roleName"
      />
    </div>
    <small id="label-help">Role Label & Color</small>
    <div style="margin-bottom: 10px">
      <InputText
        id="iamRoleLabel"
        v-model="newIamRole.label"
        name="label"
        class="p-inputtext-sm"
        style="width: 60%; margin-right: 10px"
        placeholder="roleName"
        aria-describedby="label-help"
      />
      <ColorPicker
        v-model="newIamRole.color"
        @click="colorPickerVisible = !colorPickerVisible"
      />
      <InputText
        id="newIamRoleColor"
        v-model="newIamRole.color"
        class="p-inputtext-sm"
        style="width: 20%; margin-left: 10px"
      />
    </div>
    <PDialog
      v-if="$ext.platform === 'firefox' || $ext.platform === 'safari'"
      v-model:visible="colorPickerVisible"
      :style="{ width: '50vw' }"
    >
      <ColorPicker v-if="colorPickerVisible" v-model="newIamRole.color" :inline="true" />
    </PDialog>
    <small id="profiles-help">Select the SSO profiles that can assume this IAM role</small>
    <PListbox
      id="awsAppProfiles"
      v-model="selectedProfiles"
      :options="awsAppProfiles"
      class="w-full md:w-14rem"
      style="margin-bottom: 15px"
      list-style="max-height:150px"
      multiple
    >
      <template #option="slotProps">
        <div
          class="flex align-items-center"
          style="max-height: 30px; line-height: 0; padding: 0px; margin: 0px"
        >
          <small>{{ slotProps.option.label }}</small>
        </div>
      </template>
    </PListbox>
    <PrimeButton
      size="small"
      icon="pi pi-user-plus"
      class="p-button-primary"
      label="Add IAM Role"
      style="margin-right: 10px"
      @click="addIamRole()"
    />
    <PrimeButton
      size="small"
      icon="pi pi-trash"
      class="p-button-danger"
      label="Reset All IAM Roles"
      @click="resetIamRoles()"
    />
  </div>
</template>

<script lang="ts">
import { AppData } from '../types';

export default {
  name: 'IamRoles',
  props: {
    appProfiles: {
      required: true,
      type: Array<AppData>,
    },
    awsAppProfiles: {
      required: true,
      type: Array<AppData>,
    },
  },
  emits: ['addIamRole', 'saveUser', 'updateProfile'],
  data() {
    return {
      colorPickerVisible: false,
      selectedProfiles: [] as AppData[],
      newIamRole: {
        arn: '',
        label: '',
        color: '#222f3e',
        accountId: '',
        roleName: '',
      },
    };
  },
  created() {
    //
  },
  methods: {
    setColor() {
      const color = document.getElementById('color') as HTMLInputElement;
      this.$ext.log(color);
      this.colorPickerVisible = false;
      this.newIamRole.color = color.value;
    },
    resetIamRoles() {
      this.resetIamRolePage();
      this.appProfiles.forEach((ap) => {
        ap.profile!.custom!.iamRoles = [];
        this.$emit('updateProfile', ap);
      });
    },
    invalid(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.add('p-invalid'); }
      setTimeout(() => {
        el!.classList.remove('p-invalid');
      }, 5000);
    },
    validateNewIamRole(): boolean {
      if (this.newIamRole.arn.startsWith('arn:aws:iam::')) {
        const accountId = this.newIamRole.arn.split(':')[4];
        const roleName = this.newIamRole.arn.split('/')[1];
        if (accountId === undefined || roleName === undefined) {
          // bad arn format
          this.invalid('iamRoleArn');
          return false;
        }
        if (this.selectedProfiles.length === 0) {
          // need to select at least 1 profile
          this.invalid('awsAppProfiles');
          return false;
        }
        this.newIamRole.accountId = accountId;
        this.newIamRole.roleName = roleName;
        return true;
      }
      this.invalid('iamRoleArn');
      return false;
    },
    addIamRole() {
      if (this.validateNewIamRole()) {
        this.selectedProfiles.forEach((ap) => {
          this.$emit('addIamRole', {
            profileId: ap.profile.id,
            accountId: this.newIamRole.accountId,
            roleName: this.newIamRole.roleName,
            color: this.newIamRole.color.replace('#', ''),
            label: this.newIamRole.label,
          });
        });
        this.resetIamRolePage();
        this.$emit('saveUser');
      }
    },
    resetIamRolePage() {
      this.newIamRole.arn = '';
      this.newIamRole.label = '';
      this.newIamRole.color = '#222f3e';
      this.newIamRole.accountId = '';
      this.newIamRole.roleName = '';
      this.selectedProfiles = [];
    },
  },
};
</script>

<style lang="scss" scoped>
.p-inputtext {
  padding: 5px !important;
}
</style>
