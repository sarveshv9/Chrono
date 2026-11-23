import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReorderList } from '@/components/ui/reorder-list';

type Track = { id: string; title: string; length: string };

const SETLIST: Track[] = [
  { id: 'a', title: 'Opening remarks', length: '5 min' },
  { id: 'b', title: 'Roadmap review', length: '15 min' },
  { id: 'c', title: 'Design critique', length: '20 min' },
  { id: 'd', title: 'Open questions', length: '10 min' },
];

export function ReorderListDemo() {
  const [agenda, setAgenda] = useState<Track[]>(SETLIST);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ReorderList
          items={agenda}
          getId={(t) => t.id}
          getLabel={(t) => t.title}
          onReorder={setAgenda}
          label="Meeting agenda"
          itemHeight={44}
          itemMargin={6}
        >
          {(t) => (
            <View style={styles.trackRow}>
              <Text style={styles.titleText} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={styles.lengthText}>{t.length}</Text>
            </View>
          )}
        </ReorderList>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 340,
  },
  trackRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E5E5',
    flex: 1,
    marginRight: 8,
  },
  lengthText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#888888',
  },
});

export default ReorderListDemo;
