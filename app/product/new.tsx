import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { addProduct } from '../../lib/firebase';
import { Product } from '../../types';
import { Button } from '../../components/Button';
import { Plus, X, ScanLine, Image as ImageIcon } from 'lucide-react-native';
import { uploadProductImage } from '../../lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { Modal } from 'react-native';
import { Scanner } from '../../components/Scanner';



export default function NewProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);


  const [product, setProduct] = useState<
    Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    description: '',
    barcode: params.barcode?.toString() || '',
    sku: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    category: '',
    createdBy: '',
    imageUrl: null, // Ajoutez cette ligne
  });


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'We need camera roll permissions to upload images'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleBarcodeScanned = (data: string) => {
    handleChange('barcode', data);
    setShowScanner(false);
  };


 const handleSubmit = async () => {
   try {
     setLoading(true);

     // Créez l'objet produit avec imageUrl explicitement défini
     const productToAdd = {
       ...product,
       createdAt: Timestamp.now().toMillis(),
       updatedAt: Timestamp.now().toMillis(),
       imageUrl: null, // Valeur par défaut
     };

     await addProduct(productToAdd, image || undefined);

     Alert.alert('Succès', 'Produit ajouté !');
     router.back();
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Erreur inconnue';
     Alert.alert('Erreur', message);
   } finally {
     setLoading(false);
   }
 };

  const handleChange = (
    field: keyof typeof product,
    value: string | number
  ) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <X size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
            <ImageIcon size={40} color={Colors.neutral[400]} />
            <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
          </TouchableOpacity>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            placeholderTextColor={Colors.neutral[400]}
            value={product.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter product description"
            placeholderTextColor={Colors.neutral[400]}
            value={product.description}
            onChangeText={(text) => handleChange('description', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>SKU *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter SKU"
              placeholderTextColor={Colors.neutral[400]}
              value={product.sku}
              onChangeText={(text) => handleChange('sku', text)}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.barcodeInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter barcode"
                placeholderTextColor={Colors.neutral[400]}
                value={product.barcode}
                onChangeText={(text) => handleChange('barcode', text)}
              />
              {/* <TouchableOpacity style={styles.scanButton}>
                <ScanLine size={20} color={Colors.primary[500]} />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <ScanLine size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.neutral[400]}
              value={product.price.toString()}
              onChangeText={(text) =>
                handleChange('price', parseFloat(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cost Price</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.neutral[400]}
              value={product.costPrice.toString()}
              onChangeText={(text) =>
                handleChange('costPrice', parseFloat(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.neutral[400]}
              value={product.stockQuantity.toString()}
              onChangeText={(text) =>
                handleChange('stockQuantity', parseInt(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Low Stock Threshold</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={Colors.neutral[400]}
              value={product.lowStockThreshold.toString()}
              onChangeText={(text) =>
                handleChange('lowStockThreshold', parseInt(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter category"
            placeholderTextColor={Colors.neutral[400]}
            value={product.category}
            onChangeText={(text) => handleChange('category', text)}
          />
        </View>

        <Button
          title={loading ? 'Adding...' : 'Add Product'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        >
          {loading && (
            <ActivityIndicator
              color={Colors.white}
              style={{ marginRight: 10 }}
            />
          )}
        </Button>
        <Modal visible={showScanner} animationType="slide">
          <Scanner
            onScan={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    backgroundColor: Colors.primary[500],
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: Layout.borderRadius.md,
    marginBottom: 20,
    position: 'relative',
    backgroundColor: Colors.neutral[100],
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: Layout.borderRadius.md,
    marginBottom: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.neutral[500],
    fontFamily: 'Inter-Regular',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    padding: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    position: 'absolute',
    right: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});
