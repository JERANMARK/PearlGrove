import type { Microgreen } from '../types/microgreen';

export const microgreens: Microgreen[] = [
  {
    id: 'radish',
    name: 'Radish',
    notes: 'Peppery, Crisp, Vibrant',
    description: 'A vibrant microgreen with a fresh crunch and distinctive peppery character.',
    bestSuitedFor: [
      'Salads',
      'Sandwiches',
      'Bowls',
      'Restaurant plating',
      'Modern culinary creations'
    ],
    profile: ['Peppery', 'Colourful'],
    image: '/images/Radish.jpg'
  },
  {
    id: 'pea-shoots',
    name: 'Pea Shoots',
    notes: 'Sweet, Fresh, Crisp',
    description: 'Fresh and naturally sweet with a delicate crunch.',
    bestSuitedFor: [
      'Salads',
      'Bowls',
      'Healthy meals',
      'Café dishes',
      'Garnishes'
    ],
    profile: ['Sweet'],
    image: '/images/Pea Shoots.jpg'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    notes: 'Crunchy, Fresh, Substantial',
    description: 'A fuller microgreen with a satisfying texture and fresh flavour.',
    bestSuitedFor: [
      'Salads',
      'Bowls',
      'Sandwiches',
      'Healthy meals'
    ],
    profile: ['Mild'],
    image: '/images/Sunflower.jpg'
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    notes: 'Mild, Delicate, Versatile',
    description: 'A delicate and mild microgreen suitable for a wide range of everyday dishes.',
    bestSuitedFor: [
      'Salads',
      'Healthy meals',
      'Sandwiches',
      'Bowls',
      'Garnishes'
    ],
    profile: ['Mild'],
    image: '/images/Broccoli.jpg'
  },
  {
    id: 'red-cabbage',
    name: 'Red Cabbage',
    notes: 'Colourful, Delicate, Elegant',
    description: 'A visually striking microgreen that brings colour and a delicate character to plates.',
    bestSuitedFor: [
      'Fine-dining garnishes',
      'Restaurant plating',
      'Salads',
      'Modern culinary creations'
    ],
    profile: ['Colourful', 'Mild'],
    image: '/images/Red Cabbage.jpg'
  },
  {
    id: 'mustard',
    name: 'Mustard',
    notes: 'Bold, Peppery, Distinctive',
    description: 'A bold variety with a distinctive peppery character for dishes that need extra flavour.',
    bestSuitedFor: [
      'Fine-dining dishes',
      'Salads',
      'Sandwiches',
      'Modern culinary creations'
    ],
    profile: ['Peppery'],
    image: '/images/Mustard.png'
  }
];

export const flavorProfiles = ['All', 'Mild', 'Sweet', 'Peppery', 'Colourful'] as const;