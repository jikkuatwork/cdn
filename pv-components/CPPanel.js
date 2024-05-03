export function CPPanel({ title, counter, initialValues }) {
  return {
    title: title,
    initialValues: initialValues,
    counter: n => Counter({ initialValue: n }),
    $template: /* HTML */ `
      <div class="p-2 bg-white flex flex-col gap-2 rounded-lg s">
        <div class="text-xs text-center">{{ title }}</div>
        <div class="flex gap-2">
          <div v-for="iv in initialValues" v-scope="counter(iv)"></div>
        </div>
      </div>
    `,
  }
}

export function Counter({ initialValue }) {
  return {
    $template: /* HTML */ ` <div
      class="p-2 font-mono bg-yellow-300 hover:bg-yellow-400 text-center rounded-md t select-none"
    >
      {{ count }}
      <div
        class="p-2 mt-2 bg-black bg-opacity-80 hover:bg-opacity-100 text-white rounded select-none cursor-pointer t"
        @click="increment"
      >
        +
      </div>
    </div>`,
    count: initialValue,
    increment() {
      this.count++
    },
    mounted() {
      console.log(`I'm mounted!`)
    },
  }
}
