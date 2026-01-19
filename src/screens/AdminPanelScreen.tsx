// src/screens/AdminPanelScreen.tsx
import React, { useMemo, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupsContext';
import { usePrefs } from '../context/PrefsContext';
import { colors } from '../theme/colors';
import { scaleFont } from '../utils/scaleFont';
import { Role, User } from '../models/User';
import { Group } from '../models/Group';

const AdminPanelScreen: React.FC = () => {
  const { user: me, isAdmin } = useAuth();
  const { users, groups, updateUserRoles, createGroup } = useGroups();
  const { fontSize } = usePrefs();

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCompany, setNewGroupCompany] = useState('');
  const [newGroupManagerId, setNewGroupManagerId] = useState<string | null>(
    null
  );
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (!isAdmin || !me) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.noAccess, { fontSize: scaleFont(16, fontSize) }]}>
            Brak uprawnień do panelu administratora.
          </Text>
        </View>
      </Screen>
    );
  }

  const sortedUsers: User[] = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
      ),
    [users]
  );

  const sortedGroups: Group[] = useMemo(
    () =>
      [...groups].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
      ),
    [groups]
  );

  const handleRoleChange = async (user: User, role: Role) => {
    try {
      setUpdatingUserId(user.id);

      let roles = [...(user.roles ?? [])];

      const hasRole = roles.includes(role);

      if (hasRole) {
        if (role === 'user') {
          if (roles.length === 1) {
            Alert.alert(
              'Nie można usunąć',
              'Użytkownik musi mieć przynajmniej rolę "user".'
            );
            return;
          }
        }
        roles = roles.filter(r => r !== role);

        if (roles.length === 0) {
          roles = ['user'];
        }
      } else {
        if (role === 'admin' || role === 'manager') {
          roles = Array.from(new Set([...roles, 'user', role]));
        } else {
          roles = Array.from(new Set([...roles, 'user']));
        }
      }

      await updateUserRoles(user.id, roles);
    } catch (e) {
      console.warn('Failed to update roles', e);
      Alert.alert('Błąd', 'Nie udało się zmienić ról użytkownika.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupCompany.trim() || !newGroupManagerId) {
      Alert.alert('Błąd', 'Uzupełnij wszystkie pola nowej grupy.');
      return;
    }

    try {
      setCreatingGroup(true);
      await createGroup({
        name: newGroupName.trim(),
        company: newGroupCompany.trim(),
        managerId: newGroupManagerId,
      });

      const managerUser = users.find(u => u.id === newGroupManagerId);
      if (managerUser && !managerUser.roles.includes('manager')) {
        await updateUserRoles(managerUser.id, [
          ...managerUser.roles,
          'manager',
        ]);
      }

      setNewGroupName('');
      setNewGroupCompany('');
      setNewGroupManagerId(null);
      Alert.alert('Sukces', 'Grupa została utworzona.');
    } catch (e) {
      console.warn('Failed to create group', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć grupy.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isUpdating = updatingUserId === item.id;
    const hasRole = (r: Role) => item.roles?.includes(r);

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <Text
            style={[
              styles.userName,
              { fontSize: scaleFont(14, fontSize) },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.userEmail,
              { fontSize: scaleFont(11, fontSize) },
            ]}
          >
            {item.email}
          </Text>
        </View>
        <Text
          style={[
            styles.userPosition,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          {item.position || '—'}
        </Text>

        <View style={styles.rolesRow}>
          {(['user', 'manager', 'admin'] as Role[]).map(role => {
            const active = hasRole(role);
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleChip,
                  active && styles.roleChipActive,
                  isUpdating && { opacity: 0.6 },
                ]}
                onPress={() => handleRoleChange(item, role)}
                disabled={isUpdating}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    {
                      fontSize: scaleFont(11, fontSize),
                      color: active ? '#0b1120' : colors.text,
                    },
                  ]}
                >
                  {role === 'user'
                    ? 'User'
                    : role === 'manager'
                    ? 'Manager'
                    : 'Admin'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const manager = users.find(u => u.id === item.managerId);
    return (
      <View style={styles.groupCard}>
        <Text
          style={[
            styles.groupName,
            { fontSize: scaleFont(14, fontSize) },
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.groupMeta,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Firma: {item.company}
        </Text>
        <Text
          style={[
            styles.groupMeta,
            { fontSize: scaleFont(11, fontSize) },
          ]}
        >
          Manager: {manager ? manager.name : '—'}
        </Text>
      </View>
    );
  };

  return (
    <Screen>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text
              style={[
                styles.title,
                { fontSize: scaleFont(20, fontSize) },
              ]}
            >
              Panel administratora
            </Text>

            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: scaleFont(16, fontSize) },
                ]}
              >
                Użytkownicy ({sortedUsers.length})
              </Text>
              <Text
                style={[
                  styles.sectionHint,
                  { fontSize: scaleFont(12, fontSize) },
                ]}
              >
                Kliknij w rolę, aby ją dodać lub usunąć. Użytkownik musi mieć
                przynajmniej jedną rolę (najczęściej „user”).
              </Text>
            </View>
          </>
        }
        data={sortedUsers}
        keyExtractor={u => u.id}
        renderItem={renderUserItem}
        ListFooterComponent={
          <>
            {/* GRUPY */}
            <View style={[styles.section, { marginTop: 16 }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: scaleFont(16, fontSize) },
                ]}
              >
                Grupy ({sortedGroups.length})
              </Text>
              <Text
                style={[
                  styles.sectionHint,
                  { fontSize: scaleFont(12, fontSize) },
                ]}
              >
                Zarządzaj strukturą grup i wybierz managera.
              </Text>
            </View>

            <FlatList
              data={sortedGroups}
              keyExtractor={g => g.id}
              renderItem={renderGroupItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            />

            {/* NOWA GRUPA */}
            <View style={styles.newGroupBox}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: scaleFont(15, fontSize) },
                ]}
              >
                Dodaj nową grupę
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(13, fontSize) },
                ]}
                placeholder="Nazwa grupy (np. Marketing)"
                placeholderTextColor={colors.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              <TextInput
                style={[
                  styles.input,
                  { fontSize: scaleFont(13, fontSize) },
                ]}
                placeholder="Firma (np. NovaSoft)"
                placeholderTextColor={colors.textMuted}
                value={newGroupCompany}
                onChangeText={setNewGroupCompany}
              />

              <Text
                style={[
                  styles.managerLabel,
                  { fontSize: scaleFont(12, fontSize) },
                ]}
              >
                Wybierz managera:
              </Text>
              <FlatList
                horizontal
                data={sortedUsers}
                keyExtractor={u => u.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
                renderItem={({ item }) => {
                  const selected = item.id === newGroupManagerId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.managerChip,
                        selected && styles.managerChipActive,
                      ]}
                      onPress={() =>
                        setNewGroupManagerId(
                          selected ? null : item.id
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.managerChipText,
                          {
                            fontSize: scaleFont(11, fontSize),
                            color: selected
                              ? '#0b1120'
                              : colors.text,
                          },
                        ]}
                      >
                        {item.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  creatingGroup && { opacity: 0.7 },
                ]}
                onPress={handleCreateGroup}
                disabled={creatingGroup}
              >
                <Text
                  style={[
                    styles.createButtonText,
                    { fontSize: scaleFont(14, fontSize) },
                  ]}
                >
                  {creatingGroup ? 'Tworzenie...' : 'Utwórz grupę'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </Screen>
  );
};

export default AdminPanelScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAccess: {
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    color: colors.textMuted,
  },

  userCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  userHeader: {
    marginBottom: 2,
  },
  userName: {
    color: colors.text,
    fontWeight: '600',
  },
  userEmail: {
    color: colors.textMuted,
  },
  userPosition: {
    color: colors.textMuted,
    marginTop: 2,
  },
  rolesRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  roleChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleChipText: {
    color: colors.text,
    fontWeight: '500',
  },

  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  groupName: {
    color: colors.text,
    fontWeight: '600',
  },
  groupMeta: {
    color: colors.textMuted,
    marginTop: 2,
  },

  newGroupBox: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginBottom: 6,
  },
  managerLabel: {
    color: colors.textMuted,
    marginTop: 4,
  },
  managerChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 4,
  },
  managerChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  managerChipText: {
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});
