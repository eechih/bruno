import 'aws-sdk-client-mock-jest'
import axios from 'axios'

test.skip('download imag', async () => {
  const imageUrl =
    'https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png'
  const response = await axios.get(imageUrl, {
    decompress: false,
    responseType: 'arraybuffer',
  })
  const image = response.data
  console.log('image', image)
})
