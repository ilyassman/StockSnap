import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from 'cloudinary-react-native';

// Configurez votre instance Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'ddp1u2upz', // Remplacez par votre cloudName
    apiKey: '725157631824271', // Remplacez par votre clé API
    apiSecret: '9ZMqV4_7iTSoadSqXnZR1zsycjU' // Remplacez par votre secret
  }
});

export { cld, AdvancedImage };