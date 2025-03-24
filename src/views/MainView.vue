<template>
  <div class="home flex-col">
    <div class="ui-block flex-row" style="align-items: center">
      <p-checkbox id="bulk-checkbox" v-model="bulk" :binary="true" style="" />
      <label for="bulk-checkbox">{{ locales['Main.bulk-checkbox'] }}</label>
    </div>
    <file-input
      id="input-path"
      :isDir="bulk"
      :label="locales[`Main.input-path.${Number(bulk)}`]"
      v-model="input"
      mode="open"
    />
    <mode-switch v-model="xmlInput" class="flex-row flex-center ui-block-v" />
    <div class="flex-row ui-block" style="align-items: center">
      <p-tri-state-checkbox id="compression-checkbox" v-model="compression" />
      <label v-if="compression == null" for="compression-checkbox">{{
        locales['Main.compression-checkbox.0']
      }}</label>
      <label v-if="compression == false" for="compression-checkbox">{{
        locales['Main.compression-checkbox.1']
      }}</label>
      <label v-if="compression == true" for="compression-checkbox">{{
        locales['Main.compression-checkbox.2']
      }}</label>
    </div>
    <div class="flex-row ui-block" style="align-items: center">
      <p-checkbox
        id="snbt-checkbox"
        v-model="snbt"
        binary
        :disabled="xmlInput"
      />
      <label for="snbt-checkbox">{{ locales['Main.snbt-checkbox'] }}</label>
    </div>
    <div class="ui-block flex-row" style="align-items: center">
      <p-checkbox
        id="edit-checkbox"
        v-model="edit"
        :binary="true"
        :disabled="xmlInput"
        style=""
      />
      <label for="edit-checkbox">{{ locales['Main.edit-checkbox'] }}</label>
    </div>
    <file-input
      id="output-path"
      :isDir="bulk"
      mode="save"
      :label="locales[`Main.output-path.${Number(bulk)}`]"
      v-model="output"
      :disabled="edit"
    />
    <div class="flex-col ui-block flex-center">
      <p-toggle-button
        v-if="!isConverting && (edit || isEditing)"
        id="perform-edit"
        :onLabel="locales['Main.perform-edit.0']"
        onIcon="pi fi fi-edit"
        :offLabel="locales['Main.perform-edit.1']"
        offIcon="pi pi-check"
        :modelValue="!isEditing"
        @update:modelValue="isEditing ? editClose() : editOpen()"
        class="p-button-success p-button-lg"
      />
      <p-button
        v-else
        id="perform-convert"
        :label="locales['Main.perform-convert']"
        icon="pi fi fi-exchange button-mi"
        :loading="isConverting"
        class="p-button-lg"
        @click="convert()"
      />
    </div>
  </div>
</template>

<style>
.p-button-success:not(:hover) .p-button-icon {
  transition: 0.5s ease-out;
  color: var(--primary-color-text) !important;
}

.home {
  width: 100%;
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import '@/shared/IPCTypes';
import FileInput from '@/components/FileInput.vue';
import ModeSwitch from '@/components/ModeSwitch.vue';
import { mapState, mapWritableState } from 'pinia';
import { useConfig } from '@/store/configStore';
import { ErrorCode } from '@/shared/ErrorCodes';
import { useMain } from '@/store/mainStore';

export default defineComponent({
  components: { FileInput, ModeSwitch },
  data: () => ({
    xmlInput: false,
    compression: null as null | boolean,
    bulk: false,
    edit: false,
    input: '',
    output: '',
    isConverting: false,
    snbt: true,
  }),
  watch: {
    xmlInput(val) {
      if (!val) return;
      this.edit = false;
    },
    edit(value) {
      if (!value) return;
      this.output = '';
    },
  },
  computed: {
    ...mapState(useConfig, ['locales', 'editor', 'seenLicense']),
    ...mapWritableState(useMain, ['isEditing']),
  },
  methods: {
    async convert(overwrite = false): Promise<void> {
      this.isConverting = true;
      const error = await window.backend.Convert({
        compression: this.compression == null ? undefined : this.compression,
        bulk: this.bulk,
        xmlinput: this.xmlInput,
        snbt: this.snbt,
        edit: this.edit,
        input: this.input,
        out: this.output,
        overwrite,
      });
      if (error == ErrorCode.ASK_OVERWRITE) {
        if (
          await new Promise((resolve) =>
            this.$confirm.require({
              message: this.locales[ErrorCode.ASK_OVERWRITE],
              header: '',
              icon: 'pi pi-exclamation-triangle',
              accept: () => resolve(true),
              reject: () => resolve(false),
            }),
          )
        )
          return this.convert(true);
        this.isConverting = false;
        return this.$toast.add({
          severity: 'info',
          summary: 'Info',
          detail: this.locales['Main.conversion-aborted'],
          life: 3000,
        });
      }
      error &&
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: this.locales[error],
          life: 3000,
        });

      this.isConverting = false;
      this.$toast.add({
        severity: 'success',
        summary: 'Success',
        detail: this.locales['Main.conversion-done'],
        life: 3000,
      });
    },
    async editOpen(): Promise<void> {
      if (!this.editor)
        return this.$toast.add({
          severity: 'info',
          summary: 'Info',
          detail: this.locales['Main.no-editor'],
          life: 3000,
        });
      this.isEditing = true;
      const error = await window.backend.EditOpen({
        compression: this.compression == null ? undefined : this.compression,
        bulk: this.bulk,
        xmlinput: this.xmlInput,
        snbt: this.snbt,
        edit: this.edit,
        input: this.input,
        out: this.output,
      });
      if (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error in this.locales ? this.locales[error] : error,
          life: 3000,
        });
        return;
      }
      this.isEditing = false;
    },
    editClose(): void {
      window.backend.EditClose();
    },
  },
});
</script>
