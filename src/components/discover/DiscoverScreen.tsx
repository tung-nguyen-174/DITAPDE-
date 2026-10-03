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
      {/* Sub-Tab Switcher: "Phòng tập" vs "Giáo án cộng đồng" (Apple Segmented Control) */}
      <div className="apple-segmented-control w-full">
        <button
          type="button"
          onClick={() => setSubTab('gyms')}
          className={`flex-1 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
            subTab === 'gyms'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 stroke-[1.75] shrink-0" />
          <span>Phòng tập gần đây</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('routines')}
          className={`flex-1 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
            subTab === 'routines'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4 stroke-[1.75] shrink-0" />
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
          <div className="apple-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-zinc-400 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm phòng tập theo tên, đường, khu vực..."
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-2xl bg-black/40 border border-white/10 focus:border-[#E4483C] focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 active:scale-[0.96]"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title="Định vị GPS quanh tôi"
                className="apple-btn-secondary min-h-[44px] px-3.5 py-2 text-xs font-semibold gap-1.5 shrink-0"
              >
                <Navigation
                  className={`w-4 h-4 text-[#E4483C] stroke-[1.75] ${
                    isLocating ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Gần tôi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddGymModal(true)}
                className="apple-btn-primary min-h-[44px] px-4 py-2 text-xs font-semibold gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[1.75]" />
                <span className="hidden sm:inline">Thêm phòng</span>
              </button>
            </div>

            {/* City Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {['Tất cả', 'Gần tôi', 'Thanh Hóa', 'Hà Nội', 'TP.HCM', 'Đà Nẵng'].map(
                (city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out shrink-0 active:scale-[0.98] ${
                      selectedCity === city
                        ? 'bg-white text-zinc-950 font-bold shadow-xs'
                        : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {city}
                  </button>
                )
              )}
            </div>

            {/* Active Check-in Status Banner */}
            {activeGymCheckIn && (
              <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-[#E4483C]/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      Đang Check-in: {activeGymCheckIn.name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {activeGymCheckIn.address}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400 shrink-0">
                  Đang tập
                </span>
              </div>
            )}
          </div>

          {/* Nearby Gym Cards List & Information */}
          <div className="flex flex-col gap-6">
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="apple-icon-badge-accent">
                  <Compass className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="text-left flex flex-col gap-0.5">
                  <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
                    Phòng tập gần bạn ({filteredGyms.length})
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Xem thông tin chi tiết và bấm Check-in để bắt đầu buổi tập
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
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
                    className={`p-6 rounded-2xl apple-card-interactive flex flex-col gap-5 cursor-pointer ${
                      isCheckedIn || isSelected
                        ? 'border-[#E4483C]/70 shadow-sm'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <img
                        src={gym.photoUrl}
                        alt={gym.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/10 shrink-0 shadow-xs"
                      />

                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 leading-snug">
                            {gym.name}
                          </h4>
                          {gym.city && (
                            <span className="text-xs text-zinc-400 shrink-0 font-medium">
                              {gym.city}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {gym.address}
                        </p>

                        {/* Unboxed Metadata Row with typographic separators */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-400 font-display tabular-nums">
                          <span className="text-[#E0B93D] font-semibold">
                            {gym.rating.toFixed(1)} ★ ({gym.userRatingsTotal})
                          </span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span className="text-zinc-200 font-medium">
                            {distanceStr}
                          </span>
                          {gym.activeMembers && (
                            <>
                              <span aria-hidden="true" className="text-zinc-600">·</span>
                              <span className="text-emerald-400 font-medium">
                                {gym.activeMembers} đang tập
                              </span>
                            </>
                          )}
                        </div>

                        {gym.tags && gym.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-zinc-500">
                            {gym.tags.map((tag, idx) => (
                              <React.Fragment key={tag}>
                                {idx > 0 && <span aria-hidden="true" className="text-zinc-700">·</span>}
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
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
                        isCheckedIn
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'apple-btn-accent'
                      }`}
                    >
                      {isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[1.75] shrink-0" />
                          <span>Đã Check-in Tại Đây</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 stroke-[1.75] shrink-0" />
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
            <div className="flex items-center gap-3.5">
              <div className="apple-icon-badge-accent">
                <Dumbbell className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
                Lịch tập cộng đồng
              </h3>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {['Tất cả', 'Tân Binh', 'Trung Cấp', 'Cao Thủ'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out shrink-0 active:scale-[0.98] ${
                    selectedDifficulty === lvl
                      ? 'bg-white text-zinc-950 font-bold shadow-xs'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {filteredRoutines.map((routine) => {
              const isForked = forkedMap[routine.id];

              return (
                <div
                  key={routine.id}
                  className="apple-card-interactive p-6 sm:p-8 flex flex-col gap-6"
                >
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={routine.authorAvatar}
                        alt={routine.author}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0 flex flex-col gap-1">
                        <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 leading-snug truncate">
                          {routine.title}
                        </h4>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                          <span>
                            Bởi{' '}
                            <strong className="text-zinc-200 font-medium">
                              {routine.author}
                            </strong>
                          </span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span>{routine.frequency}</span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span className="text-[#E4483C] font-semibold">
                            {routine.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {routine.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 py-3 text-sm"
                      >
                        <span className="text-zinc-200 font-normal">
                          {idx + 1}. {ex.name}
                        </span>
                        <span className="font-display tabular-nums text-[#E4483C] text-xs font-semibold shrink-0">
                          {ex.sets} hiệp × {ex.repsRange}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-zinc-400 font-display tabular-nums font-medium truncate min-w-0">
                      <strong className="text-zinc-100">
                        {routine.forksCount}
                      </strong>{' '}
                      người đã lưu lịch
                    </span>

                    <button
                      onClick={() => handleFork(routine)}
                      className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-semibold border transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-2 shrink-0 whitespace-nowrap ${
                        isForked
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'apple-btn-accent'
                      }`}
                    >
                      {isForked ? (
                        <Check className="w-4 h-4 stroke-[1.75]" />
                      ) : (
                        <GitFork className="w-4 h-4 stroke-[1.75]" />
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

      {/* Modal Thêm Phòng Tập Mới (Apple HIG Modal) */}
      {showAddGymModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
                Thêm Phòng Tập Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddGymModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 active:scale-[0.96]"
                title="Đóng modal"
                aria-label="Đóng modal"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGym} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-200">
                  Tên phòng tập *
                </label>
                <input
                  type="text"
                  required
                  value={newGymName}
                  onChange={(e) => setNewGymName(e.target.value)}
                  placeholder="VD: Viking Gym & Fitness"
                  className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#E4483C] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-200">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={newGymCity}
                  onChange={(e) => setNewGymCity(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-sm text-zinc-100 focus:border-[#E4483C] focus:outline-none transition-colors"
                >
                  <option value="Thanh Hóa">Thanh Hóa</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-200">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={newGymAddress}
                  onChange={(e) => setNewGymAddress(e.target.value)}
                  placeholder="VD: 45 Lê Hoàn, Phường Điện Biên"
                  className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#E4483C] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGymModal(false)}
                  className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="apple-btn-accent min-h-[44px] px-5 py-2 text-xs font-semibold"
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
