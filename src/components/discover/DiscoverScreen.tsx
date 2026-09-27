import React, { useState, useMemo, useEffect } from 'react';
import {
  APIProvider,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  GitFork,
  Check,
  CheckCircle2,
  Navigation,
  Dumbbell,
  Search,
  Plus,
  Compass,
  X,
} from 'lucide-react';
import { RoutineTemplate } from '../../types/gym';
import { ROUTINE_TEMPLATES } from '../../data/mockData';
import {
  GymLocationModel,
  GooglePlacesService,
  GOOGLE_MAPS_API_KEY,
  CITY_COORDINATES,
  formatDistanceLabel,
  calculateDistanceMeters,
} from '../../services/googlePlacesService';

interface DiscoverScreenProps {
  onForkRoutine: (routine: RoutineTemplate) => void;
  onStartWithRoutine?: (routine: RoutineTemplate) => void;
  activeGymCheckIn?: GymLocationModel;
  onCheckInGym?: (gym: GymLocationModel) => void;
}

const PlacesFetcher: React.FC<{
  coords: { lat: number; lng: number };
  onGymsLoaded: (gyms: GymLocationModel[]) => void;
}> = ({ coords, onGymsLoaded }) => {
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    GooglePlacesService.fetchNearbyGyms({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters: 3000,
      placesLib,
    }).then((gyms) => {
      if (!cancelled && gyms.length > 0) {
        onGymsLoaded(gyms);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [placesLib, coords.lat, coords.lng]);

  return null;
};

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  onForkRoutine,
  activeGymCheckIn,
  onCheckInGym,
}) => {
  const [subTab, setSubTab] = useState<'gyms' | 'routines'>('gyms');
  const [nearbyGyms, setNearbyGyms] = useState<GymLocationModel[]>(() =>
    GooglePlacesService.getCachedOrFallbackGyms()
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.8075,
    lng: 105.7764,
  });
  const [selectedGym, setSelectedGym] = useState<GymLocationModel>(
    () => activeGymCheckIn || GooglePlacesService.getCachedOrFallbackGyms()[0]
  );
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Add Custom Gym Modal State
  const [showAddGymModal, setShowAddGymModal] = useState<boolean>(false);
  const [newGymName, setNewGymName] = useState<string>('');
  const [newGymAddress, setNewGymAddress] = useState<string>('');
  const [newGymCity, setNewGymCity] = useState<string>('Thanh Hóa');

  const [routines, setRoutines] = useState<RoutineTemplate[]>(ROUTINE_TEMPLATES);
  const [forkedMap, setForkedMap] = useState<Record<string, boolean>>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Tất cả');

  const filteredGyms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nearbyGyms
      .filter((gym) => {
        if (selectedCity !== 'Tất cả' && selectedCity !== 'Gần tôi') {
          if (gym.city && gym.city !== selectedCity) {
            return gym.address
              .toLowerCase()
              .includes(selectedCity.toLowerCase());
          }
        }
        if (!q) return true;
        return (
          gym.name.toLowerCase().includes(q) ||
          gym.address.toLowerCase().includes(q) ||
          (gym.tags && gym.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        const distA = calculateDistanceMeters(
          userCoords.lat,
          userCoords.lng,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistanceMeters(
          userCoords.lat,
          userCoords.lng,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      });
  }, [nearbyGyms, selectedCity, searchQuery, userCoords]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    const coords = await GooglePlacesService.getCurrentLocation();
    setUserCoords(coords);
    const gyms = await GooglePlacesService.fetchNearbyGyms({
      lat: coords.lat,
      lng: coords.lng,
      radiusMeters: 3000,
    });
    setNearbyGyms(gyms);
    setSelectedCity('Gần tôi');
    if (gyms.length > 0) {
      setSelectedGym(gyms[0]);
    }
    setIsLocating(false);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (city === 'Gần tôi') {
      handleLocateMe();
      return;
    }
    if (CITY_COORDINATES[city]) {
      setUserCoords(CITY_COORDINATES[city]);
      const match = nearbyGyms.find(
        (g) =>
          g.city === city || g.address.toLowerCase().includes(city.toLowerCase())
      );
      if (match) setSelectedGym(match);
    }
  };

  const handleSelectGym = (gym: GymLocationModel) => {
    setSelectedGym(gym);
  };

  const handleCheckInHere = (gym: GymLocationModel) => {
    setSelectedGym(gym);
    GooglePlacesService.saveCheckIn(gym);
    if (onCheckInGym) {
      onCheckInGym(gym);
    }
  };

  const handleCreateCustomGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGymName.trim() || !newGymAddress.trim()) return;
    const created = GooglePlacesService.addCustomGym({
      name: newGymName,
      address: newGymAddress,
      city: newGymCity,
    });
    const refreshed = GooglePlacesService.getCachedOrFallbackGyms();
    setNearbyGyms(refreshed);
    setSelectedGym(created);
    handleCheckInHere(created);
    setNewGymName('');
    setNewGymAddress('');
    setShowAddGymModal(false);
  };

  const handleFork = (routine: RoutineTemplate) => {
    setForkedMap((prev) => ({ ...prev, [routine.id]: true }));
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routine.id ? { ...r, forksCount: r.forksCount + 1 } : r
      )
    );
    onForkRoutine(routine);
  };

  const filteredRoutines = routines.filter((r) => {
    if (selectedDifficulty === 'Tất cả') return true;
    return r.difficulty === selectedDifficulty;
  });

  return (
    <div className="flex flex-col p-6 sm:p-8 gap-6 max-w-3xl mx-auto w-full bg-zinc-950 text-zinc-100">
      {/* Sub-Tab Switcher: "Phòng tập" vs "Giáo án cộng đồng" */}
      <div className="flex items-center gap-2 backdrop-blur-md bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 shadow-sm">
        <button
          type="button"
          onClick={() => setSubTab('gyms')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            subTab === 'gyms'
              ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
          }`}
        >
          <MapPin className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>Phòng tập gần đây</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('routines')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            subTab === 'routines'
              ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
          }`}
        >
          <Dumbbell className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>Giáo án cộng đồng</span>
        </button>
      </div>

      {subTab === 'gyms' ? (
        <section className="flex flex-col gap-6">
          {GOOGLE_MAPS_API_KEY && (
            <APIProvider
              apiKey={GOOGLE_MAPS_API_KEY}
              language="vi"
              region="VN"
            >
              <PlacesFetcher
                coords={userCoords}
                onGymsLoaded={(gyms) => {
                  setNearbyGyms(gyms);
                  setSelectedGym(
                    (prev) =>
                      gyms.find((g) => g.placeId === prev?.placeId) || gyms[0]
                  );
                }}
              />
            </APIProvider>
          )}

          {/* Search & City Filter Bar */}
          <div className="p-6 backdrop-blur-md bg-zinc-900/50 border border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 stroke-[1.5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm phòng tập theo tên, đường, khu vực..."
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-200 ease-in-out"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 p-1 transition-all duration-200"
                  >
                    <X className="w-4 h-4 stroke-[1.5]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title="Định vị GPS quanh tôi"
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-100 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <Navigation
                  className={`w-4 h-4 text-emerald-400 stroke-[1.5] ${
                    isLocating ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Gần tôi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddGymModal(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <Plus className="w-4 h-4 stroke-[1.5]" />
                <span className="hidden sm:inline">Thêm phòng</span>
              </button>
            </div>

            {/* City Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['Tất cả', 'Gần tôi', 'Thanh Hóa', 'Hà Nội', 'TP.HCM', 'Đà Nẵng'].map(
                (city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ease-in-out shrink-0 border focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                      selectedCity === city
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-sm'
                        : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border-zinc-800'
                    }`}
                  >
                    {city}
                  </button>
                )
              )}
            </div>

            {/* Active Check-in Status Banner */}
            {activeGymCheckIn && (
              <div className="px-4 py-3 rounded-xl bg-zinc-950/80 border border-emerald-500/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      Đang Check-in: {activeGymCheckIn.name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {activeGymCheckIn.address}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 shrink-0">
                  Đang tập
                </span>
              </div>
            )}
          </div>

          {/* Nearby Gym Cards List & Information */}
          <div className="flex flex-col gap-6">
            <div className="w-full flex items-center justify-between gap-4">
              <div className="text-left flex flex-col gap-1">
                <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
                  <span>Phòng tập gần bạn ({filteredGyms.length})</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Xem thông tin chi tiết phòng tập gần bạn và bấm Check-in để bắt đầu buổi tập
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {filteredGyms.map((gym) => {
                const isSelected = selectedGym?.placeId === gym.placeId;
                const isCheckedIn = activeGymCheckIn?.placeId === gym.placeId;
                const distanceStr = formatDistanceLabel(
                  userCoords.lat,
                  userCoords.lng,
                  gym.latitude,
                  gym.longitude
                );

                return (
                  <div
                    key={gym.placeId}
                    onClick={() => handleSelectGym(gym)}
                    className={`p-6 rounded-2xl backdrop-blur-md bg-zinc-900/50 border shadow-sm transition-all duration-200 ease-in-out hover:bg-zinc-800/40 flex flex-col gap-5 cursor-pointer ${
                      isCheckedIn || isSelected
                        ? 'border-emerald-500/50'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <img
                        src={gym.photoUrl}
                        alt={gym.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 leading-snug">
                            {gym.name}
                          </h4>
                          {gym.city && (
                            <span className="text-xs text-zinc-400 shrink-0">
                              {gym.city}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {gym.address}
                        </p>

                        {/* Unboxed Metadata Row with typographic separators */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-400 font-display tabular-nums">
                          <span className="text-emerald-400 font-semibold">
                            {gym.rating.toFixed(1)} ★ ({gym.userRatingsTotal})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-zinc-100 font-medium">
                            {distanceStr}
                          </span>
                          {gym.activeMembers && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400">
                                {gym.activeMembers} đang tập
                              </span>
                            </>
                          )}
                        </div>

                        {gym.tags && gym.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-zinc-500">
                            {gym.tags.map((tag, idx) => (
                              <React.Fragment key={tag}>
                                {idx > 0 && <span aria-hidden="true">·</span>}
                                <span>{tag}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckInHere(gym);
                      }}
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2 shadow-sm ${
                        isCheckedIn
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                      }`}
                    >
                      {isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[1.5] shrink-0" />
                          <span>Đã Check-in Tại Đây</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 stroke-[1.5] shrink-0" />
                          <span>Check-in Tại Đây</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* Community Forkable Routines Sub-Tab */
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
              Lịch tập cộng đồng
            </h3>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['Tất cả', 'Tân Binh', 'Trung Cấp', 'Cao Thủ'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                    selectedDifficulty === lvl
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'backdrop-blur-md bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {filteredRoutines.map((routine) => {
              const isForked = forkedMap[routine.id];

              return (
                <div
                  key={routine.id}
                  className="backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-sm transition-all duration-200 ease-in-out hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={routine.authorAvatar}
                        alt={routine.author}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 leading-snug truncate">
                          {routine.title}
                        </h4>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                          <span>
                            Bởi{' '}
                            <strong className="text-zinc-100 font-medium">
                              {routine.author}
                            </strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{routine.frequency}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-medium">
                            {routine.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-zinc-800/80 border-y border-zinc-800/80">
                    {routine.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 py-3 text-sm"
                      >
                        <span className="text-zinc-100 font-normal">
                          {idx + 1}. {ex.name}
                        </span>
                        <span className="font-display tabular-nums text-emerald-400 text-xs font-medium shrink-0">
                          {ex.sets} hiệp × {ex.repsRange}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-xs text-zinc-400 font-display tabular-nums">
                      <strong className="text-zinc-100">
                        {routine.forksCount}
                      </strong>{' '}
                      người đã lưu lịch
                    </span>

                    <button
                      onClick={() => handleFork(routine)}
                      className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center gap-2 shadow-sm ${
                        isForked
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-500'
                      }`}
                    >
                      {isForked ? (
                        <Check className="w-4 h-4 stroke-[1.5]" />
                      ) : (
                        <GitFork className="w-4 h-4 stroke-[1.5]" />
                      )}
                      <span>{isForked ? 'Đã lưu lịch' : 'Xin lịch tập'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal Thêm Phòng Tập Mới */}
      {showAddGymModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md backdrop-blur-md bg-zinc-900/95 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
                Thêm Phòng Tập Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGymModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGym} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Tên phòng tập *
                </label>
                <input
                  type="text"
                  required
                  value={newGymName}
                  onChange={(e) => setNewGymName(e.target.value)}
                  placeholder="VD: Viking Gym & Fitness"
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={newGymCity}
                  onChange={(e) => setNewGymCity(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:ring-2 focus:ring-zinc-500 focus:outline-none transition-all duration-200"
                >
                  <option value="Thanh Hóa">Thanh Hóa</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={newGymAddress}
                  onChange={(e) => setNewGymAddress(e.target.value)}
                  placeholder="VD: 45 Lê Hoàn, Phường Điện Biên"
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGymModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Lưu & Check-in Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
