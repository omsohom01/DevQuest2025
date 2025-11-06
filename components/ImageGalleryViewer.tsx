import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

interface ImageGalleryViewerProps {
    visible: boolean;
    onClose: () => void;
    images: string[]; // Array of image URLs
    fileName: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageGalleryViewer({ visible, onClose, images, fileName }: ImageGalleryViewerProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewRef = useRef((viewableItems: any) => {
        if (viewableItems.viewableItems.length > 0) {
            setCurrentIndex(viewableItems.viewableItems[0].index || 0);
        }
    });

    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderImage = ({ item, index }: { item: string; index: number }) => (
        <View style={styles.imageContainer}>
            <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                            {fileName}
                        </Text>
                        <Text style={[styles.pageInfo, { color: colors.icon }]}>
                            Page {currentIndex + 1} of {images.length}
                        </Text>
                    </View>
                </View>

                {/* Image Gallery */}
                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={renderImage}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `page-${index}`}
                    onViewableItemsChanged={onViewRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    getItemLayout={(data, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                />

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <View style={styles.pageIndicator}>
                        <TouchableOpacity
                            onPress={() => {
                                if (currentIndex > 0) {
                                    flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
                                }
                            }}
                            disabled={currentIndex === 0}
                            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={currentIndex === 0 ? colors.icon : colors.primary}
                            />
                        </TouchableOpacity>

                        <View style={styles.pageCounter}>
                            <Text style={[styles.pageText, { color: colors.text }]}>
                                {currentIndex + 1} / {images.length}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                if (currentIndex < images.length - 1) {
                                    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
                                }
                            }}
                            disabled={currentIndex === images.length - 1}
                            style={[styles.navButton, currentIndex === images.length - 1 && styles.navButtonDisabled]}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={24}
                                color={currentIndex === images.length - 1 ? colors.icon : colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 4,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    pageInfo: {
        fontSize: 13,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - 160, // Account for header and footer
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_HEIGHT - 200,
    },
    footer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    pageIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    pageCounter: {
        flex: 1,
        alignItems: 'center',
    },
    pageText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
