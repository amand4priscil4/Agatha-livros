import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@agatha_livros_favoritos';
const API_URL = 'https://openlibrary.org/search.json?q=agatha+christie&limit=20';

export default function HomeScreen() {
  const [livros, setLivros] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar livros da API
  const buscarLivros = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      
      const livrosFormatados = data.docs.map((livro: any) => ({
        id: livro.key,
        titulo: livro.title,
        autor: livro.author_name ? livro.author_name[0] : 'Autor desconhecido',
        anoPublicacao: livro.first_publish_year || 'Ano não informado',
        paginas: livro.number_of_pages_median || 'N/A',
        capa: livro.cover_i 
          ? `https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg`
          : null
      }));
      
      setLivros(livrosFormatados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os livros');
      console.error('Erro ao buscar livros:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar favoritos do armazenamento local
  const carregarFavoritos = async () => {
    try {
      const favoritosSalvos = await AsyncStorage.getItem(STORAGE_KEY);
      if (favoritosSalvos) {
        setFavoritos(JSON.parse(favoritosSalvos));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  // Salvar favoritos no armazenamento local
  const salvarFavoritos = async (novosFavoritos: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novosFavoritos));
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  };

  // Adicionar/remover favorito
  const toggleFavorito = async (livro: any) => {
    const jaEhFavorito = favoritos.find((fav: any) => fav.id === livro.id);
    
    let novosFavoritos;
    if (jaEhFavorito) {
      novosFavoritos = favoritos.filter((fav: any) => fav.id !== livro.id);
      Alert.alert('Removido', `"${livro.titulo}" foi removido dos favoritos`);
    } else {
      novosFavoritos = [...favoritos, livro];
      Alert.alert('Adicionado', `"${livro.titulo}" foi adicionado aos favoritos`);
    }
    
    setFavoritos(novosFavoritos);
    await salvarFavoritos(novosFavoritos);
  };

  // Verificar se é favorito
  const ehFavorito = (livroId: string) => {
    return favoritos.some((fav: any) => fav.id === livroId);
  };

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    buscarLivros();
  };

  // Renderizar item da lista
  const renderLivro = ({ item }: { item: any }) => (
    <View style={styles.livroContainer}>
      <View style={styles.livroContent}>
        {item.capa && (
          <Image source={{ uri: item.capa }} style={styles.capa} />
        )}
        <View style={styles.livroInfo}>
          <Text style={styles.titulo} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.autor}>Por: {item.autor}</Text>
          <Text style={styles.detalhes}>Ano: {item.anoPublicacao}</Text>
          <Text style={styles.detalhes}>Páginas: {item.paginas}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.botaoFavorito,
          ehFavorito(item.id) && styles.botaoFavoritoAtivo
        ]}
        onPress={() => toggleFavorito(item)}
      >
        <Text style={[
          styles.textoBotaoFavorito,
          ehFavorito(item.id) && styles.textoBotaoFavoritoAtivo
        ]}>
          {ehFavorito(item.id) ? '❤️ Favorito' : '🤍 Favoritar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    carregarFavoritos();
    buscarLivros();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Agatha Livros</Text>
        <Text style={styles.headerSubtitle}>
          Livros de Agatha Christie | Favoritos: {favoritos.length}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Carregando livros...</Text>
        </View>
      ) : (
        <FlatList
          data={livros}
          keyExtractor={(item) => item.id}
          renderItem={renderLivro}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B4513']}
            />
          }
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  lista: {
    padding: 15,
  },
  livroContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  livroContent: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  capa: {
    width: 60,
    height: 90,
    borderRadius: 5,
    marginRight: 15,
  },
  livroInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  autor: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 5,
  },
  detalhes: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  botaoFavorito: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  botaoFavoritoAtivo: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  textoBotaoFavorito: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  textoBotaoFavoritoAtivo: {
    color: '#fff',
  },
});