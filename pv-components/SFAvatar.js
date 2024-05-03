function Image({ url }) {
  return {
    url: url,
    $template: /* HTML */ `
      <div class="flex justify-center my-4">
        <img :src="url" alt="Avatar" class="w-24 h-24 rounded-full shadow-lg" />
      </div>
    `,
  }
}

function TextBlock({ title, subtitle }) {
  return {
    title,
    subtitle,
    $template: /* HTML */ `
      <div class="text-center">
        <h2 class="text-lg font-bold">{{ title }}</h2>
        <p class="text-sm text-white text-opacity-60">{{ subtitle }}</p>
      </div>
    `,
  }
}

const Ballot = ({ n }) => {
  return {
    vote: n,
    $template: /* HTML */ `
      <div
        class="p-2 text-white bg-black bg-opacity-10 flex gap-2 justify-center items-center rounded-lg mt-6"
      >
        <div
          @click="d"
          class="px-3 py-1 bg-black rounded select-none cursor-pointer"
        >
          -
        </div>
        <div class="font-mono w-6 text-center">{{ vote }}</div>
        <div
          @click="i"
          class="px-3 py-1 bg-black rounded select-none cursor-pointer"
        >
          +
        </div>
      </div>
    `,
    i() {
      this.vote++
    },
    d() {
      this.vote--
    },
  }
}

export function SFAvatar({ title, subtitle, url, initialVote }) {
  return {
    textBlock: TextBlock({ title: title, subtitle: subtitle }),
    ballot: Ballot({ n: initialVote }),
    image: Image({ url: url }),
    $template: /* HTML */ `
      <div
        class="p-4 bg-gray-100 t bg-opacity-10 text-white shadow rounded-lg mb-2 border border-yellow-300 border-opacity-10 hover:border-opacity-60"
        style="min-width: 180px;"
      >
        <div v-scope="image"></div>
        <div v-scope="textBlock"></div>
        <div v-scope="ballot"></div>
      </div>
    `,
  }
}
