import React, { useState, useEffect } from 'react';
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
import { Colors } from '../../../constants/Colors';
import { Layout } from '../../../constants/Layout';
import { Product } from '../../../types';
import { Button } from '../../../components/Button';
import { X, ScanLine, Image as ImageIcon } from 'lucide-react-native';
import {
  getProductById,
  updateProduct,
  uploadProductImage,
} from '../../../lib/firebase';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // Charger le produit existant
  useEffect(() => {
    const loadProduct = async () => {
      if (typeof id !== 'string') return;

      setLoading(true);
      try {
        const productData = await getProductById(id);
        if (productData) {
          setProduct(productData);
          setCurrentImageUrl(productData.imageUrl);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin des permissions pour accéder à vos images'
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
      setCurrentImageUrl(null); // Reset l'URL existante si nouvelle image sélectionnée
    }
  };

  const handleSubmit = async () => {
    if (!product) return;

    try {
      setLoading(true);

      // Préparer les données de mise à jour
      const updatedData = {
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        sku: product.sku,
        price: product.price,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        category: product.category,
      };

      // Si nouvelle image sélectionnée, upload vers Cloudinary
      // Sinon, garder l'image existante (currentImageUrl)
      await updateProduct(product.id, updatedData, image || undefined);

      Alert.alert('Succès', 'Produit mis à jour !');
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Product, value: string | number) => {
    if (!product) return;

    setProduct({
      ...product,
      [field]: value,
    });
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  // ... (imports restants identiques)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier Produit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section Image (identique) */}
        {currentImageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImageUrl }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setCurrentImageUrl(null)}
            >
              <X size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : image ? (
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
            <Text style={styles.imagePlaceholderText}>Changer l'image</Text>
          </TouchableOpacity>
        )}

        {/* Formulaire complet */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom du Produit *</Text>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
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
              value={product.sku}
              onChangeText={(text) => handleChange('sku', text)}
              keyboardType="default"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Code-barres</Text>
            <View style={styles.barcodeInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={product.barcode}
                onChangeText={(text) => handleChange('barcode', text)}
              />
              <TouchableOpacity style={styles.scanButton}>
                <ScanLine size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Prix de vente *</Text>
            <TextInput
              style={styles.input}
              value={product.price.toString()}
              onChangeText={(text) =>
                handleChange('price', parseFloat(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Prix de revient</Text>
            <TextInput
              style={styles.input}
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
            <Text style={styles.label}>Stock actuel</Text>
            <TextInput
              style={styles.input}
              value={product.stockQuantity.toString()}
              onChangeText={(text) =>
                handleChange('stockQuantity', parseInt(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Seuil d'alerte</Text>
            <TextInput
              style={styles.input}
              value={product.lowStockThreshold.toString()}
              onChangeText={(text) =>
                handleChange('lowStockThreshold', parseInt(text) || 5)
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            value={product.category}
            onChangeText={(text) => handleChange('category', text)}
          />
        </View>

        <Button
          title={loading ? 'Enregistrement...' : 'Enregistrer modifications'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

// Utilisez les mêmes styles que dans NewProductScreen
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
  submitButton: {
    marginTop: 20,
  },
});
