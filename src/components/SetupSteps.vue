<!-- eslint-disable vue/max-len -->
<!-- eslint-disable max-len -->
<template>
  <div
    class="card"
    style="padding-left: 20px"
  >
    <PAccordion
      :active-index="!permissions.sso ? 0 : 1"
      style="padding-right: 20px; padding-bottom: 20px"
    >
      <PAccordionTab :disabled="permissions.sso">
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px">Required Permissions</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="permissions.sso ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="permissions.sso ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <p>This extension requires access to awsapps.com.</p>
        <PrimeButton
          size="small"
          icon="pi pi-lock"
          class="p-button-success"
          label="Request Permissions"
          @click="requestPermissionsDirectory()"
        />
        <!--- TODO add granular site perms options --->
      </PAccordionTab>

      <PAccordionTab :disabled="loaded">
        <template #header>
          <div style="width: 90%">
            <span style="margin-left: 5px">Login to AWS SSO</span>
          </div>
          <div style="width: 10%">
            <i
              class="pi"
              :class="loaded === true ? 'pi-check-circle' : 'pi-exclamation-circle'"
              :style="loaded === true ? 'color: green;' : 'color: orange;'"
            />
          </div>
        </template>
        <div>
          <p>
            Login to AWS SSO to populate your profiles. Your login link typically looks
            like this:
          </p>
          <code>companyName.awsapps.com/start#/</code>
          <br>
          <code>directoryId.awsapps.com/start#/</code>
        </div>
        <PDivider
          v-if="!permissions.history && $ext.platform !== 'safari'"
          type="solid"
        >
          <small>Optional - Find login links in browser history</small>
        </PDivider>
        <LoginLinks v-if="$ext.platform !== 'safari'" />
      </PAccordionTab>
    </PAccordion>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SetupSteps',
  props: {
    loaded: {
      required: true,
      type: Boolean,
      default: false,
    },
    permissions: {
      required: true,
      type: Object,
      default: () => ({
        sso: false,
        console: false,
        signin: false,
        history: false,
      }),
    },
  },
  methods: {
    requestPermissionsDirectory(directoryId = null) {
      if (directoryId !== null) {
        // TODO support granular directory permissions
        // sso = [`'https://${directoryId}.awsapps.com/start*'`];
      }
      this.$ext.config.browser.permissions.request({
        origins: this.$ext.config.permissions.sso,
      });
      window.close();
    },
  },
};
</script>

<style lang="scss" scoped></style>
