import {
  Tailwind,
  Text,
  Link,
  Hr,
  Html,
  Head,
  Body,
  Container,
  Heading,
  Preview,
} from '@react-email/components'

export default function VerifyEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="font-sans bg-white text-gray-600">
          <Preview>验证您的邮箱</Preview>
          <Container className="bg-gray-50 mx-auto my-0 p-12 rounded">
            <Heading className="text-2xl text-gray-900 font-bold w-full mb-8">
              验证您的邮箱
            </Heading>
            <Text>点击下面的按钮验证您的邮箱</Text>
            <Link
              className="text-md py-2 px-4 bg-green-500 text-gray-900 font-medium rounded cursor-pointer"
              href={url}
              target="_blank"
            >
              验证邮箱
            </Link>
            <Text>或者复制下面链接在浏览器中打开</Text>

            <Text>
              <Link
                className="text-current underline"
                href={url}
                target="_blank"
              >
                {url}
              </Link>
            </Text>

            <Hr />
            <Text className="text-xs">感谢您的注册</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
