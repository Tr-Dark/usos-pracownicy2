// src/screens/GroupsScreen.tsx
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { useGroups } from '../context/GroupsContext';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { scaleFont } from '../utils/scaleFont';
import { colors } from '../theme/colors';
import { Group } from '../models/Group';
import { UserAvatar } from '../components/UserAvatar';

const GroupsScreen: React.FC = () => {
  const { visibleGroups, users } = useGroups();
  const { user } = useAuth();
  const { fontSize } = usePrefs();
  const [emailInputByGroup, setEmailInputByGroup] = useState<Record<string, string>>({});
  const { addUserToGroup } = useGroups();

  const isManagerOrAdmin = user?.roles.includes('admin') || user?.roles.includes('manager');

  const handleAdd = async (group: Group) => {
    const email = emailInputByGroup[group.id]?.trim();
    if (!email) {
      Alert.alert('Błąd', 'Podaj email użytkownika');
      return;
    }
    try {
      await addUserToGroup(email, group.id);
      setEmailInputByGroup(prev => ({ ...prev, [group.id]: '' }));
      Alert.alert('Sukces', 'Użytkownik dodany do grupy');
    } catch (e: any) {
      Alert.alert('Błąd', e.message ?? 'Nie udało się dodać użytkownika');
    }
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const manager = users.find(u => u.id === item.managerId);
    const members = users.filter(u => u.groupIds.includes(item.id));

    return (
      <View style={styles.card}>
        <Text style={[styles.groupName, { fontSize: scaleFont(18, fontSize) }]}>
          {item.name}
        </Text>
        <Text style={[styles.company, { fontSize: scaleFont(12, fontSize) }]}>
          {item.company}
        </Text>
        <Text style={[styles.manager, { fontSize: scaleFont(12, fontSize) }]}>
          Manager: {manager?.name ?? '—'}
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: scaleFont(12, fontSize) }]}>
          Uczestnicy
        </Text>
        <View style={styles.membersRow}>
          {members.map(m => (
            <View key={m.id} style={styles.memberItem}>
              <UserAvatar uri={m.avatar} label={m.name} size={32} />
              <View style={{ marginLeft: 8 }}>
                <Text
                  style={[
                    styles.memberName,
                    { fontSize: scaleFont(12, fontSize) },
                  ]}
                >
                  {m.name}
                </Text>
                <Text
                  style={[
                    styles.memberPosition,
                    { fontSize: scaleFont(10, fontSize) },
                  ]}
                >
                  {m.position}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {isManagerOrAdmin && (
          <View style={styles.addRow}>
            <TextInput
              style={[
                styles.input,
                { fontSize: scaleFont(12, fontSize) },
              ]}
              placeholder="Email pracownika"
              placeholderTextColor={colors.textMuted}
              value={emailInputByGroup[item.id] ?? ''}
              onChangeText={text =>
                setEmailInputByGroup(prev => ({ ...prev, [item.id]: text }))
              }
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAdd(item)}
            >
              <Text
                style={[
                  styles.addButtonText,
                  { fontSize: scaleFont(12, fontSize) },
                ]}
              >
                Dodaj
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: scaleFont(20, fontSize) }]}>
          Twoje grupy
        </Text>
        <FlatList
          contentContainerStyle={{ paddingVertical: 12 }}
          data={visibleGroups}
          keyExtractor={g => g.id}
          renderItem={renderGroup}
        />
      </View>
    </Screen>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  groupName: {
    color: colors.text,
    fontWeight: '600',
  },
  company: {
    color: colors.textMuted,
    marginTop: 2,
  },
  manager: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  memberName: {
    color: colors.text,
  },
  memberPosition: {
    color: colors.textMuted,
  },
  addRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    color: colors.text,
    marginRight: 8,
  },
  addButton: {
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
